from importlib.util import module_from_spec, spec_from_file_location
from pathlib import Path
import unittest
from unittest.mock import MagicMock, patch


MIGRATION_PATH = (
    Path(__file__).resolve().parents[1]
    / "alembic"
    / "versions"
    / "005_add_apple_social_provider.py"
)
MIGRATION_SPEC = spec_from_file_location("apple_social_migration_005", MIGRATION_PATH)
if MIGRATION_SPEC is None or MIGRATION_SPEC.loader is None:
    raise RuntimeError("Apple migration module could not be loaded")

apple_migration = module_from_spec(MIGRATION_SPEC)
MIGRATION_SPEC.loader.exec_module(apple_migration)


class AppleMigrationTest(unittest.TestCase):
    def _run_upgrade(self, provider_type: str, columns: set[str]) -> MagicMock:
        connection = MagicMock()

        with (
            patch.object(apple_migration.op, "get_bind", return_value=connection),
            patch.object(
                apple_migration,
                "_get_provider_column_type",
                return_value=provider_type,
            ),
            patch.object(
                apple_migration,
                "_get_social_account_columns",
                return_value=columns,
            ),
            patch.object(apple_migration.op, "execute") as execute,
            patch.object(apple_migration.op, "add_column") as add_column,
        ):
            apple_migration.upgrade()

        result = MagicMock()
        result.execute = execute
        result.add_column = add_column
        return result

    def test_upgrade_applies_all_changes_to_revision_004_schema(self) -> None:
        result = self._run_upgrade(
            "enum('google','kakao','naver')",
            {"id", "provider"},
        )

        self.assertEqual(result.execute.call_count, 1)
        self.assertEqual(result.add_column.call_count, 2)

    def test_upgrade_finishes_after_first_column_was_already_created(self) -> None:
        result = self._run_upgrade(
            "enum('google','kakao','naver','apple')",
            {"id", "provider", "apple_refresh_token"},
        )

        result.execute.assert_not_called()
        result.add_column.assert_called_once()
        added_column = result.add_column.call_args.args[1]
        self.assertEqual(added_column.name, "apple_token_updated_at")

    def test_upgrade_skips_schema_that_is_already_complete(self) -> None:
        result = self._run_upgrade(
            "enum('google','kakao','naver','apple')",
            {
                "id",
                "provider",
                "apple_refresh_token",
                "apple_token_updated_at",
            },
        )

        result.execute.assert_not_called()
        result.add_column.assert_not_called()


if __name__ == "__main__":
    unittest.main()
