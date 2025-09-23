# Plaid Production Setup Guide

## Prerequisites ✅
- [x] Production Plaid credentials obtained
- [x] Application profile completed
- [x] Security questionnaire submitted
- [x] OAuth configuration implemented
- [x] Testing suite deployed

## Required Environment Variables

Add these to your Supabase Edge Functions secrets:

```bash
# Plaid Production Credentials
PLAID_CLIENT_ID=your_production_client_id
PLAID_SECRET=your_production_secret_key

# Optional: Environment flag (defaults to production)
PLAID_ENV=production
```

## Setup Steps

### 1. Update Supabase Edge Function Secrets

Navigate to: https://supabase.com/dashboard/project/nbrcdphgadabjndynyvy/settings/functions

Add the following secrets:
- `PLAID_CLIENT_ID`: Your production client ID
- `PLAID_SECRET`: Your production secret key

### 2. Configure OAuth Redirect URIs in Plaid Dashboard

Add these redirect URIs in your Plaid dashboard:
- Production: `https://your-domain.com/auth/callback`
- Preview: `https://nbrcdphgadabjndynyvy.supabase.co/auth/callback`
- Local: `http://localhost:5173/auth/callback`

### 3. Update Webhook URL

Ensure your webhook URL is registered:
```
https://nbrcdphgadabjndynyvy.supabase.co/functions/v1/plaid-webhook
```

### 4. Test OAuth Banks

Test with these OAuth-required institutions:
- Chase
- Wells Fargo
- Bank of America
- Capital One

### 5. Monitor Initial Transactions

After connecting accounts, monitor:
- Webhook processing in Edge Function logs
- Transaction categorization accuracy
- Reconciliation reports

## Security Checklist

- [ ] Access tokens are encrypted in database
- [ ] Audit logging is enabled for all financial operations
- [ ] Rate limiting is configured for API calls
- [ ] RLS policies are properly configured
- [ ] Webhook signature verification is enabled

## Testing Workflow

1. Navigate to `/plaid-testing`
2. Run OAuth tests with a real bank account
3. Verify webhook processing
4. Check transaction categorization
5. Test update mode with credential changes
6. Verify reconciliation reports

## Support Resources

- [Plaid Production Dashboard](https://dashboard.plaid.com/overview/production)
- [Plaid API Documentation](https://plaid.com/docs/)
- [Supabase Edge Functions Logs](https://supabase.com/dashboard/project/nbrcdphgadabjndynyvy/functions)

## Common Issues & Solutions

### OAuth Redirect Issues
- Ensure redirect URI matches exactly (including trailing slashes)
- Check HTTPS is enabled in production
- Verify mobile app deep linking is configured

### Webhook Failures
- Check Edge Function logs for errors
- Verify webhook URL is accessible
- Ensure proper CORS headers are set

### Transaction Sync Issues
- Check access token validity
- Verify account is still connected
- Review rate limiting if hitting limits

## Next Steps

1. Complete production testing with real accounts
2. Set up monitoring and alerting
3. Configure backup and recovery procedures
4. Document user support procedures