import axios from 'axios';

const APITXT_BASE_URL = 'https://apitxt.com/api';

/**
 * Get APITXT configuration from environment variables
 */
const getConfig = () => ({
  authKey: process.env.APITXT_AUTH_KEY || '',
  senderId: process.env.APITXT_SENDER_ID || '',
  peId: process.env.APITXT_PE_ID || '',
  defaultTemplateId: process.env.APITXT_DEFAULT_DLT_TEMPLATE_ID || '',
  defaultRoute: process.env.APITXT_DEFAULT_ROUTE || '4',
  defaultCountry: process.env.APITXT_DEFAULT_COUNTRY || '91',
  projectRefId: process.env.APITXT_PROJECT_REF_ID || '',
});

/**
 * Send Transactional or Promotional SMS to one or multiple recipients.
 * Endpoint: https://apitxt.com/api/sendMsg
 */
export async function sendSms({
  mobiles,
  message,
  sender,
  route,
  templateId,
  peId,
  schtime,
  flash = 0,
  unicode = 0,
}) {
  const config = getConfig();

  const recipientString = Array.isArray(mobiles)
    ? mobiles.map((m) => m.toString().replace(/\D/g, '').slice(-10)).join(',')
    : mobiles.toString().replace(/\s+/g, '');

  if (!recipientString || !message) {
    throw new Error('Mobiles and message are required to send SMS.');
  }

  // Graceful fallback if no API key is configured
  if (!config.authKey || config.authKey === 'your_apitxt_auth_key_here') {
    console.log(`\x1b[33m[APITXT DEV MODE]\x1b[0m SMS to ${recipientString}: "${message}"`);
    return {
      success: true,
      simulated: true,
      message: 'Simulated SMS sent (APITXT_AUTH_KEY not configured)',
      data: {
        request_id: `SIM_SMS_${Date.now()}`,
        mobiles: recipientString,
      },
    };
  }

  const params = {
    authkey: config.authKey,
    mobiles: recipientString,
    message: encodeURIComponent(message),
    sender: (sender || config.senderId || 'TRPVLT').toUpperCase(),
    route: route || config.defaultRoute || '4',
    template_id: templateId || config.defaultTemplateId,
    pe_id: peId || config.peId,
    flash,
    unicode,
  };

  if (schtime) {
    params.schtime = schtime;
  }

  try {
    const response = await axios.get(`${APITXT_BASE_URL}/sendMsg`, {
      params,
      timeout: 10000,
    });

    return {
      success: true,
      simulated: false,
      data: response.data,
    };
  } catch (error) {
    const errorDetails = error.response?.data || error.message;
    console.error('[APITXT sendMsg Error]:', errorDetails);
    return {
      success: false,
      simulated: false,
      error: typeof errorDetails === 'object' ? JSON.stringify(errorDetails) : errorDetails,
    };
  }
}

/**
 * Dispatch Trip Companion Invite SMS Notification
 */
export async function sendTripInviteSms({ mobile, tripName, inviterName, inviteUrl }) {
  const message = `${inviterName || 'Your companion'} invited you to the trip vault "${tripName}" on TripVault. View & split expenses: ${inviteUrl || 'https://tripvault.app'}`;
  return sendSms({
    mobiles: mobile,
    message,
  });
}

/**
 * Dispatch Settlement or Expense Alert SMS Notification
 */
export async function sendExpenseAlertSms({ mobile, tripName, payerName, amount, currency = '₹' }) {
  const message = `TripVault: ${payerName} added ${currency}${amount} for "${tripName}". Check live split breakdown at tripvault.app`;
  return sendSms({
    mobiles: mobile,
    message,
  });
}

export default {
  sendSms,
  sendTripInviteSms,
  sendExpenseAlertSms,
};
