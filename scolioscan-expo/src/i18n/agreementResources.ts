import { AGREEMENTS } from '@/src/features/auth/agreements';

const ko = Object.fromEntries(
  AGREEMENTS.flatMap((agreement) => [
    [`agreements.${agreement.key}.label`, agreement.label],
    [`agreements.${agreement.key}.body`, agreement.body],
  ]),
);

const en = {
  'agreements.terms.label': '(Required) Agree to the Terms of Service',
  'agreements.terms.body': `Article 1 (Purpose)
These Terms set forth the rights, obligations, and responsibilities of the Company and its members in connection with use of the application provided by Nextvine Co., Ltd.

Article 2 (Nature of the Service)
1. The Service is a platform that provides information related to medical assistive devices and functions for managing user records.
2. The Service does not constitute medical practice under the Medical Service Act of the Republic of Korea.
3. The Service is not a product approved or certified as a medical device under the Medical Devices Act of the Republic of Korea and does not provide functions intended for diagnosis, treatment, or prevention.
4. Recommendations and information provided through the Service are for general reference only. Automated analysis, including algorithm-based recommendations, has no legal or medical effect.

Article 3 (Publication and Amendment of Terms)
The Company will publish these Terms within the Service and provide advance notice of any amendment. Amendments unfavorable to members will be announced at least 30 days in advance.

Article 4 (Formation of the Service Agreement)
A service agreement is formed when a member agrees to these Terms and the Privacy Policy. The Company may restrict registration in cases involving identity theft, false information, abnormal access, or automated registration attempts.

Article 5 (Service Content)
The Company provides information on medical assistive devices, management of user-entered records, general guides and reference information, and integration with external services with the user's consent.

Article 6 (Changes and Suspension)
The Company may change or suspend all or part of the Service due to system maintenance or failure, termination of a partnership, or requirements imposed by laws or regulatory authorities, including the Ministry of Food and Drug Safety.

Article 7 (Member Obligations)
Members must not enter false health information, use Service results as the basis for medical decisions, transfer accounts, or misuse the Service.

Article 8 (Use of Data)
The Company may use user data to provide and improve the Service. Data used for statistics or research will be de-identified so that individuals cannot be identified.

Article 9 (External Services)
1. The terms of each external service apply when that service is used.
2. The Company is not responsible for failures or data processing by external services.

Article 10 (Intellectual Property)
Rights in the Service and its content belong to the Company or the applicable rights holder.

Article 11 (Limitation of Liability)
1. The Service does not provide medical judgment and does not replace diagnosis or treatment by a healthcare professional.
2. The Company does not guarantee the accuracy, completeness, or suitability of information or recommendations.
3. The Company is not responsible for damage or changes in health arising from a user's choice or judgment.
4. The Company is not responsible for indirect, special, or consequential damage.

Article 12 (Indemnification)
If a member's violation of these Terms causes damage to the Company, the member is responsible for compensating the Company.

Article 13 (Governing Law and Jurisdiction)
These Terms are governed by the laws of the Republic of Korea. Disputes will be resolved by the court having jurisdiction over the location of the Company's principal office.`,
  'agreements.privacy.label': '(Required) Consent to Collection and Use of Personal Information',
  'agreements.privacy.body': `Nextvine Co., Ltd. complies with the Personal Information Protection Act and other applicable laws of the Republic of Korea.

1. Information Collected
Required: email address, password, and nickname
Optional: gender and age group
Sensitive information: health status and assistive-device usage information
Automatically collected: IP address, device information, advertising ID, cookies, and usage records

2. Collection Methods
Information entered during registration, generated while using the Service, or received through an external service integration with the user's consent.

3. Purposes of Use
Member management and authentication; provision and operation of the Service; personalized, non-medical features; service improvement and analysis; and prevention of misuse.

4. Processing of Health-Related Information
Health-related information is processed to provide the Service, not for diagnosis or treatment. It is de-identified when used for statistics or research and is not provided to third parties without consent unless required by law.

5. Automated Decision-Making
The Company may provide algorithm-based recommendations. Such recommendations have no legal or medical effect.

6. Retention Period
Information is deleted immediately when membership is terminated, except where retention is required by law. Contract and transaction records are retained for 5 years, consumer-dispute records for 3 years, and access logs for 3 months.

7. Provision to Third Parties
Information may be provided with the user's explicit consent, when connecting to a medical institution or external service, or where required by law.

8. Processing Contractors
The Company may outsource processing for operation of the Service, including cloud services such as AWS or GCP and messaging services such as Firebase.

9. Advertising Services and Third-Party Processing
The Company uses Google AdMob to provide in-app advertisements, measure advertising performance, and prevent invalid activity. In this process, advertising identifiers, IP addresses, device information, and app usage data may be transmitted to and processed by Google. The availability of personalized ads and privacy choices can be managed through the in-app privacy choices screen where required by applicable law and the user's region. Google Privacy Policy: https://policies.google.com/privacy

10. Overseas Transfer
Information may be transferred abroad while providing the Service. Example destination: United States; information transferred: service usage data; purpose: service operation.

11. User Rights
Users may request access, correction, deletion, or suspension of processing of their personal information.

12. Cookies and Tracking Technologies
The Company may use cookies and SDKs to improve the user experience.

13. Security Measures
The Company uses data encryption, access controls, and security systems.

14. Children's Privacy
Children under 14 require consent from a legal representative.

15. Privacy Officer
Name: Hee-chang Lim
Title: CEO
Email: ceo@nextvinetech.com

16. Policy Changes
This policy may be revised in response to changes in laws or the Service. Advance notice will be provided.`,
  'agreements.sensitive.label': '(Required) Consent to Collection and Use of Sensitive Information',
  'agreements.sensitive.body': `The Company collects and uses health-related information to improve convenience when using the Service.

1. Information Collected
Assistive-device usage information, including whether and how it is used, and health-status information entered directly by the user.

2. Purposes of Use
To provide personalized information, improve convenience, and provide general reference information and guidance. This information is not used for medical diagnosis, treatment, or prevention.

3. Processing
Internal processing, including algorithms, may use information entered by the user to provide general information. Results are for reference only and do not determine or evaluate the user's health status. Data used for statistics or research is de-identified.

4. Retention Period
Deleted immediately when membership is terminated.

5. Right to Refuse
Users may refuse consent. If consent is refused, some personalized features may be unavailable.`,
  'agreements.marketing.label': '(Optional) Consent to Event and Marketing Communications',
  'agreements.marketing.body': `The Company may send event and marketing information to provide notices about events and the Service.

1. Purposes
Information about events and benefits, and notices about service updates. Communications will not claim or guarantee medical efficacy or effects.

2. Channels
Email and app push notifications.

3. Retention Period
Until consent is withdrawn.

4. Refusal and Withdrawal
Users may refuse or withdraw consent at any time without affecting use of the Service.`,
  'agreements.external.label': '(Optional) Consent to External Service Integration',
  'agreements.external.body': `The Company may provide integrations with external services for user convenience.

1. Information Provided
User identification information, including email address and nickname, and health-related information within the scope consented to by the user.

2. Recipients
Partner service providers, assistive-device service providers, and medical institutions only where the user explicitly requests an integration.

3. Purpose
Data integration and user convenience. The integration is not intended to provide medical practice or medical services.

4. Retention Period
Until the integration is disconnected or membership is terminated.

5. Right to Refuse
Users may refuse consent. If consent is refused, integration features may be unavailable.

6. Notice
The terms and policies of each external service apply when it is used. The Company is not responsible for data processing or service provision by external services.`,
} as const;

const ja = {
  'agreements.terms.label': '（必須）利用規約への同意',
  'agreements.terms.body': `第1条（目的）
本規約は、株式会社ネクストバインが提供する本アプリの利用に関し、会社と会員の権利・義務および責任事項を定めることを目的とします。

第2条（サービスの性質）
1. 本サービスは、医療補助器具に関する情報提供およびユーザー記録管理機能を提供するプラットフォームです。
2. 本サービスは、韓国の医療法上の医療行為には該当しません。
3. 本サービスは、韓国の医療機器法に基づく許可・認証を受けた医療機器ではなく、診断・治療・予防を目的とする機能を提供しません。
4. 本サービスが提供する推奨事項および情報は一般的な参考情報です。アルゴリズムに基づく推奨を含む自動分析に、法的または医学的な効力はありません。

第3条（規約の掲示および変更）
会社は本規約をサービス内に掲示し、変更する場合は事前に告知します。会員に不利益となる変更は、少なくとも30日前に告知します。

第4条（利用契約の成立）
会員が本規約およびプライバシーポリシーに同意した時点で利用契約が成立します。会社は、他人の情報の不正使用、虚偽情報の入力、不正なアクセスまたは自動登録の試みがある場合、登録を制限できます。

第5条（サービス内容）
会社は、医療補助器具に関する情報、ユーザー入力に基づく記録管理、一般的なガイドおよび参考情報、ならびにユーザーの同意に基づく外部サービス連携機能を提供します。

第6条（サービスの変更および中断）
会社は、システム点検・障害、提携終了、法令または食品医薬品安全処などの規制当局からの要請がある場合、サービスの全部または一部を変更・中断できます。

第7条（会員の義務）
会員は、虚偽の健康情報の入力、サービス結果を医療判断の根拠として使用する行為、アカウントの譲渡、不正利用を行ってはなりません。

第8条（データの利用）
会社はサービスの提供および改善のためにユーザーデータを利用できます。統計・研究目的で利用する場合は、個人を識別できないよう匿名化します。

第9条（外部サービス連携）
1. 外部サービスの利用時には、当該サービスの規約が適用されます。
2. 会社は外部サービスの障害およびデータ処理について責任を負いません。

第10条（知的財産権）
サービスおよびコンテンツに関する権利は、会社または正当な権利者に帰属します。

第11条（責任の制限）
1. 本サービスは医療判断を提供せず、医療専門家による診断および治療に代わるものではありません。
2. 会社は、提供する情報および推奨事項の正確性、完全性、適合性を保証しません。
3. 会社は、ユーザーの選択または判断により生じた損害や健康状態の変化について責任を負いません。
4. 会社は、間接損害、特別損害、結果的損害について責任を負いません。

第12条（損害賠償）
会員の規約違反により会社に損害が生じた場合、会員はこれを賠償する責任を負います。

第13条（準拠法および管轄）
本規約は大韓民国法を準拠法とし、紛争は会社の本店所在地を管轄する裁判所で解決します。`,
  'agreements.privacy.label': '（必須）個人情報の収集・利用への同意',
  'agreements.privacy.body': `株式会社ネクストバインは、韓国の個人情報保護法などの関係法令を遵守します。

1. 収集項目
必須：メールアドレス、パスワード、ニックネーム
任意：性別、年齢層
要配慮情報：健康状態、補助器具の利用情報
自動収集：IPアドレス、端末情報、広告ID、Cookie、利用履歴

2. 収集方法
会員登録時の入力、サービス利用過程、ユーザー同意に基づく外部サービス連携。

3. 利用目的
会員管理および認証、サービスの提供・運営、非医療目的のパーソナライズ機能、サービスの改善・分析、不正利用の防止。

4. 健康関連情報の取扱い
健康関連情報は、診断・治療ではなくサービス提供のために処理します。統計・研究に利用する場合は匿名化し、法令に基づく場合を除き、同意なく第三者へ提供しません。

5. 自動化された意思決定
会社はアルゴリズムに基づく推奨を提供する場合がありますが、法的または医学的な効力はありません。

6. 保有・利用期間
退会時に直ちに削除します。ただし、法令に基づき、契約・取引記録は5年、消費者紛争記録は3年、アクセスログは3か月保管します。

7. 第三者提供
ユーザーの明示的な同意がある場合、医療機関または外部サービスと連携する場合、法令に基づく場合に提供することがあります。

8. 取扱いの委託
サービス運営のため、AWS・GCPなどのクラウドサービスやFirebaseなどのメッセージングサービスへ処理を委託する場合があります。

9. 広告サービスおよび第三者による取扱い
当社は、アプリ内広告の提供、広告効果の測定および不正利用の防止のため、Google AdMobを利用します。この過程で、広告ID、IPアドレス、端末情報およびアプリ利用情報がGoogleに送信され、処理される場合があります。パーソナライズド広告の可否およびプライバシーに関する選択は、適用法令および利用者の地域に応じて必要な場合、アプリ内のプライバシー選択画面で管理できます。Google プライバシーポリシー: https://policies.google.com/privacy

10. 国外移転
サービス提供の過程で情報が国外へ移転される場合があります。移転先の例：米国、移転項目：サービス利用データ、目的：サービス運営。

11. ユーザーの権利
ユーザーは個人情報の閲覧、訂正、削除、処理停止を請求できます。

12. Cookieおよび追跡技術
ユーザー体験の改善のため、CookieおよびSDKを使用する場合があります。

13. 安全管理措置
データ暗号化、アクセス権限管理、セキュリティシステムの運用を実施します。

14. 児童の個人情報
14歳未満の児童は法定代理人の同意が必要です。

15. 個人情報保護責任者
氏名：イム・ヒチャン
役職：CEO
メール：ceo@nextvinetech.com

16. ポリシーの変更
法令またはサービスの変更に応じて改定する場合があり、事前に告知します。`,
  'agreements.sensitive.label': '（必須）要配慮情報の収集・利用への同意',
  'agreements.sensitive.body': `会社は、サービス利用の利便性向上のため、ユーザーの健康関連情報を収集・利用します。

1. 収集項目
補助器具の利用有無・利用パターンなどの利用情報、およびユーザーが直接入力した健康状態に関する情報。

2. 利用目的
ユーザーに合わせた情報の提供、利便性の向上、一般的な参考情報およびガイドの提供。本情報は医療上の診断・治療・予防には使用しません。

3. 処理方法
ユーザー入力に基づき、一般情報を提供するための内部処理（アルゴリズムの利用を含む）を行う場合があります。結果は参考情報であり、健康状態を判断または評価するものではありません。統計・研究目的では個人を識別できないよう匿名化します。

4. 保有・利用期間
退会時に直ちに削除します。

5. 同意を拒否する権利
ユーザーは同意を拒否できます。その場合、一部のパーソナライズ機能を利用できないことがあります。`,
  'agreements.marketing.label': '（任意）イベント・マーケティング情報の受信への同意',
  'agreements.marketing.body': `会社は、イベントおよびサービス案内のため、イベント・マーケティング情報を送信する場合があります。

1. 利用目的
イベント・特典の案内、サービス更新のお知らせ。送信する情報には、医療上の効能・効果を保証または説明する内容を含みません。

2. 受信方法
メールおよびアプリのプッシュ通知。

3. 保有・利用期間
同意を撤回するまで。

4. 拒否および撤回
ユーザーはいつでも同意を拒否または撤回でき、サービスの利用には影響しません。`,
  'agreements.external.label': '（任意）外部サービス連携への同意',
  'agreements.external.body': `会社は、ユーザーの利便性向上のため、外部サービスとの連携機能を提供する場合があります。

1. 提供項目
メールアドレス、ニックネームなどのユーザー識別情報、およびユーザーが同意した範囲の健康関連情報。

2. 提供先
提携サービス事業者、補助器具関連サービス事業者、ならびにユーザーが明示的に希望した場合の医療機関。

3. 利用目的
データ連携およびユーザーの利便性向上。本連携は医療行為または医療サービスの提供を目的としません。

4. 保有・利用期間
連携解除または退会まで。

5. 同意を拒否する権利
ユーザーは同意を拒否できます。その場合、連携機能を利用できないことがあります。

6. 注意事項
外部サービスの利用時には、当該サービスの規約およびポリシーが適用されます。会社は外部サービスのデータ処理およびサービス提供について責任を負いません。`,
} as const;

export const agreementResources = { ko, en, ja };
