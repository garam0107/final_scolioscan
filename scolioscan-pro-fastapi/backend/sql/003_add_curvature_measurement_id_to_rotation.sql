-- 003_add_curvature_measurement_id_to_rotation
-- 기준: backend/alembic/versions/003_add_curvature_measurement_id_to_rotation.py
-- 적용 전제: rotation_measurements, curvature_measurements 테이블이 이미 존재해야 합니다.
-- 주의: 이미 같은 컬럼/인덱스/FK가 있으면 중복 오류가 발생할 수 있습니다.

ALTER TABLE `rotation_measurements`
  ADD COLUMN `curvature_measurement_id` INT NULL;

CREATE INDEX `ix_rotation_measurements_curvature_measurement_id`
  ON `rotation_measurements` (`curvature_measurement_id`);

ALTER TABLE `rotation_measurements`
  ADD CONSTRAINT `fk_rotation_measurements_curvature_measurement_id`
  FOREIGN KEY (`curvature_measurement_id`)
  REFERENCES `curvature_measurements` (`id`);
