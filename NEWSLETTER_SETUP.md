# Newsletter Setup - Netlify Forms

## What was done

The newsletter feature has been implemented using **Netlify Forms**, which is a built-in feature that requires no additional configuration on your end. Here's what you need to know:

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
