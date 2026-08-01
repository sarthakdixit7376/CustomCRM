import { Link } from 'react-router-dom';

const SECTION_CLASS = 'flex flex-col gap-2';
const HEADING_CLASS = 'text-lg font-semibold text-text mt-2';
const PARAGRAPH_CLASS = 'text-sm text-text-muted leading-relaxed';

export default function PrivacyPolicy() {
  return (
    <div className="min-h-dvh bg-surface-muted text-text font-sans">
      <div className="max-w-3xl mx-auto px-6 py-12 flex flex-col gap-6">
        <div>
          <Link to="/login" className="text-sm text-primary-600 hover:underline">
            &larr; Back to MdarAi
          </Link>
          <h1 className="text-2xl font-bold text-text mt-4 mb-1">Privacy Policy</h1>
          <p className="text-sm text-text-muted">Last updated: August 1, 2026</p>
        </div>

        <div className={SECTION_CLASS}>
          <p className={PARAGRAPH_CLASS}>
            MdarAi ("MdarAi," "we," "us," or "our") provides a customer relationship management (CRM) platform used by
            insurance agents and staff to manage leads, customers, policies, and — optionally — email communication
            through an integration with Google's Gmail API. This Privacy Policy explains what information we collect,
            how we use it, and the choices you have, with particular attention to data accessed through Google APIs.
          </p>
        </div>

        <div className={SECTION_CLASS}>
          <h2 className={HEADING_CLASS}>Information We Collect</h2>
          <p className={PARAGRAPH_CLASS}>
            <strong>Account information.</strong> When your organization creates a user account for you, we store your
            name, email address, and a securely hashed password. This is used solely to authenticate you and control
            access within the CRM.
          </p>
          <p className={PARAGRAPH_CLASS}>
            <strong>CRM business data.</strong> Staff using MdarAi may enter information about leads, customers,
            insurance policies, and related contact details as part of normal use of the platform.
          </p>
          <p className={PARAGRAPH_CLASS}>
            <strong>Google user data.</strong> If you choose to connect a Gmail account to MdarAi's Email feature, we
            access the following data via the Gmail API, only after you explicitly grant permission through Google's
            OAuth consent screen:
          </p>
          <ul className="list-disc list-outside pl-5 flex flex-col gap-1">
            <li className={PARAGRAPH_CLASS}>Your Google account's email address, used to identify which mailbox is connected.</li>
            <li className={PARAGRAPH_CLASS}>
              Email metadata and content (sender, recipients, subject, timestamp, message body, and attachment
              information) for messages in your inbox, so they can be displayed to you inside the CRM.
            </li>
            <li className={PARAGRAPH_CLASS}>The ability to send email on your behalf, only when you actively compose and send a message from within the CRM.</li>
          </ul>
        </div>

        <div className={SECTION_CLASS}>
          <h2 className={HEADING_CLASS}>How We Use Google User Data</h2>
          <p className={PARAGRAPH_CLASS}>
            Google user data obtained through the Gmail API is used exclusively to provide the Email feature within
            MdarAi: displaying your inbox, letting you read individual messages, and sending messages on your behalf
            when you choose to. We do not use Google user data for advertising, do not sell it, and do not use it to
            train or improve any generalized artificial intelligence or machine learning models.
          </p>
          <p className={PARAGRAPH_CLASS}>
            MdarAi's use and transfer of information received from Google APIs adheres to the{' '}
            <a
              href="https://developers.google.com/terms/api-services-user-data-policy"
              target="_blank"
              rel="noopener noreferrer"
              className="text-primary-600 hover:underline"
            >
              Google API Services User Data Policy
            </a>
            , including the Limited Use requirements.
          </p>
        </div>

        <div className={SECTION_CLASS}>
          <h2 className={HEADING_CLASS}>Data Storage &amp; Security</h2>
          <p className={PARAGRAPH_CLASS}>
            We do not store the content of your emails on our servers. Message content and attachments are fetched
            live from Google's Gmail API each time you view your inbox and are not retained in our database.
          </p>
          <p className={PARAGRAPH_CLASS}>
            To keep your Gmail account connected, we store the connected email address along with an encrypted OAuth
            access token and refresh token (encrypted at rest using AES-256-GCM). These tokens are used only to make
            authenticated requests to the Gmail API on your behalf and are never shared with third parties.
          </p>
        </div>

        <div className={SECTION_CLASS}>
          <h2 className={HEADING_CLASS}>Data Retention &amp; Revoking Access</h2>
          <p className={PARAGRAPH_CLASS}>
            Your connected Gmail account's tokens are retained until you disconnect it. You can disconnect a Gmail
            account at any time from the Email tab inside MdarAi, which immediately and permanently deletes the
            stored tokens for that account from our database.
          </p>
          <p className={PARAGRAPH_CLASS}>
            You can also revoke MdarAi's access at any time directly from your Google Account, at{' '}
            <a
              href="https://myaccount.google.com/permissions"
              target="_blank"
              rel="noopener noreferrer"
              className="text-primary-600 hover:underline"
            >
              myaccount.google.com/permissions
            </a>
            .
          </p>
        </div>

        <div className={SECTION_CLASS}>
          <h2 className={HEADING_CLASS}>Sharing of Information</h2>
          <p className={PARAGRAPH_CLASS}>
            We do not sell your personal information or Google user data. We do not share it with third parties
            except where required to operate the service itself (such as our database and hosting providers acting
            strictly on our behalf) or where required by law.
          </p>
        </div>

        <div className={SECTION_CLASS}>
          <h2 className={HEADING_CLASS}>Children's Privacy</h2>
          <p className={PARAGRAPH_CLASS}>
            MdarAi is a business tool intended for use by insurance agency staff and is not directed at children. We
            do not knowingly collect information from children.
          </p>
        </div>

        <div className={SECTION_CLASS}>
          <h2 className={HEADING_CLASS}>Changes to This Policy</h2>
          <p className={PARAGRAPH_CLASS}>
            We may update this Privacy Policy from time to time. Changes will be posted on this page along with an
            updated "Last updated" date above.
          </p>
        </div>

        <div className={SECTION_CLASS}>
          <h2 className={HEADING_CLASS}>Contact Us</h2>
          <p className={PARAGRAPH_CLASS}>
            If you have questions about this Privacy Policy, or wish to request deletion of your data, please contact
            us at{' '}
            <a href="mailto:dixitsarthak004@gmail.com" className="text-primary-600 hover:underline">
              dixitsarthak004@gmail.com
            </a>
            .
          </p>
        </div>
      </div>
    </div>
  );
}
