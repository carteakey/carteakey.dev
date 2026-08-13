# Newsletter Setup

## What was done

Netlify Forms collects consented subscribers. A scheduled Netlify Function sends a digest on Fridays at 14:00 UTC through Resend, but only when the public Atom feed contains a post newer than the last successful issue.

## Required production environment

- `NETLIFY_AUTH_TOKEN` and `NETLIFY_SITE_ID`: read the `newsletter` form submissions.
- `UPSTASH_REDIS_REST_URL` and `UPSTASH_REDIS_REST_TOKEN`: store the last sent post and hashed unsubscribe entries.
- `RESEND_API_KEY`: deliver the email.
- `NEWSLETTER_SECRET`: a long random value used to sign one-click unsubscribe links.
- Optional `NEWSLETTER_FROM` and `NEWSLETTER_REPLY_TO`: override the defaults.

The default sender is `Kartikey Chauhan <digest@newsletter.carteakey.dev>`. The `newsletter.carteakey.dev` sending domain must remain verified in Resend.

## Editorial behavior

- At most one issue per week.
- No issue when nothing new was published.
- Only public blog posts from `/feed.xml` are included.
- Each recipient gets an individual unsubscribe link.
- A successful issue records its newest post, preventing duplicate sends if the job reruns.

## Test an issue

Run `npm run newsletter:test -- you@example.com`. The command always writes the rendered issue to `.cache/newsletter-preview.html`. With `RESEND_API_KEY` and `NEWSLETTER_SECRET` configured, it also sends that exact issue to the supplied address. If the past week is quiet, test mode uses the newest public post so the layout can still be checked.

Submission totals are also counted in Upstash Redis after Netlify accepts the form. Configure `UPSTASH_REDIS_REST_URL` and `UPSTASH_REDIS_REST_TOKEN` in Netlify to enable those counters. No email address or name is sent to the tracking function; it records only the form source and aggregate date.

## How it works

1. **Form Submission**: When someone submits the newsletter form, Netlify automatically captures the data
2. **Email Notifications**: You'll receive email notifications for each submission (to your Netlify account email)
3. **Form Dashboard**: All submissions are stored in your Netlify dashboard under "Forms"

## Accessing Submissions

1. Go to your Netlify dashboard: https://app.netlify.com/
2. Select your site (carteakey.dev)
3. Click on "Forms" in the left sidebar
4. You'll see the "newsletter" form with all submissions

## What you need to do

### Option 1: Use Netlify's built-in features (Recommended for now)
- **Nothing!** It's already working. Just check your Netlify dashboard to see submissions.
- You can export submissions as CSV from the dashboard
- You'll get email notifications for each new subscriber

### Option 2: Set up email notifications
1. Go to Netlify Dashboard > Site Settings > Forms > Form notifications
2. Configure where you want to receive notifications (email, Slack, webhook, etc.)

### Option 3: Integrate with email service (Optional - for automated newsletters)
If you want to send automated emails, you'll need to:
1. Sign up for an email service (Mailchimp, ConvertKit, Buttondown, etc.)
2. Use Netlify's webhook feature to send form data to your email service
3. Or manually export the CSV from Netlify and import to your email service

## Current Setup

The form captures:
- **Name**: Subscriber's name
- **Email**: Subscriber's email address
- **Consent**: Checkbox confirming they want to receive emails
- **Bot protection**: Honeypot field to prevent spam

## Testing

To test the newsletter:
1. Visit https://carteakey.dev/newsletter/ (or your preview URL)
2. Fill out and submit the form
3. Check your Netlify dashboard Forms section to see the submission
4. You should also receive an email notification (if enabled)

## No additional costs

Netlify Forms is free for up to 100 submissions per month on the free tier. After that, it's $19/month for up to 1,000 submissions.

## Notes

- The form uses `data-netlify="true"` which tells Netlify to handle it
- Spam protection is built-in with the honeypot field
- The form submission is handled via AJAX for a better user experience
- Success/error states are shown without page reload
