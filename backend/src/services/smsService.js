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
 * Send an OTP code to a single mobile number via SMS, WhatsApp, or Voice.
 * Endpoint: https://apitxt.com/api/sendOTP
 *
 * @param {Object} params
 * @param {string|number} params.mobile - 10-digit mobile number or number with country code
 * @param {string|number} params.otp - The OTP code to send (e.g. '1234' or '123456')
 * @param {'sms'|'whatsapp'|'voice'} [params.channel='sms'] - Delivery channel
 * @param {string|number} [params.templateId] - SMS template ID (optional)
 * @param {string} [params.country] - Country code without '+' (default '91')
 * @param {string} [params.templateName] - WhatsApp template name (optional)
 * @param {string} [params.projectRefId] - WhatsApp project ref ID (optional)
 * @returns {Promise<{ success: boolean, data?: any, error?: string, simulated?: boolean }>}
 */
export async function sendOtp({
  mobile,
  otp,
  channel = 'sms',
  templateId,
  country,
  templateName,
  projectRefId,
}) {
  const config = getConfig();

  // Normalize mobile
  let cleanMobile = mobile ? mobile.toString().replace(/\D/g, '') : '';
  if (!cleanMobile) {
    throw new Error('Mobile number is required for sending OTP.');
  }

  const selectedCountry = country || config.defaultCountry || '91';

  // Format mobile to include country code (e.g. 919876543210) as expected by APITXT
  let formattedMobile = cleanMobile;
  if (formattedMobile.length === 10) {
    formattedMobile = `${selectedCountry}${formattedMobile}`;
  }

  // If no auth key configured, operate in graceful fallback / dev mode
  if (!config.authKey || config.authKey === 'your_apitxt_auth_key_here') {
    console.log(`\x1b[33m[APITXT DEV MODE]\x1b[0m OTP ${otp} simulated for +${formattedMobile} via ${channel}`);
    return {
      success: true,
      simulated: true,
      message: `Simulated OTP sent via ${channel} (APITXT_AUTH_KEY not configured)`,
      data: {
        request_id: `SIM_OTP_${Date.now()}`,
        mobile: formattedMobile,
        otp,
      },
    };
  }

  const params = {
    authkey: config.authKey,
    mobile: formattedMobile,
    otp: String(otp),
    channel: channel || 'sms',
    country: selectedCountry,
  };

  if (templateId || config.defaultTemplateId) {
    params.template_id = templateId || config.defaultTemplateId;
  }

  if (templateName) {
    params.template_name = templateName;
  }

  const projRef = projectRefId || config.projectRefId;
  if (projRef) {
    params.project_ref_id = projRef;
  }

  try {
    console.log(`[APITXT] Sending ${channel.toUpperCase()} OTP to ${formattedMobile}...`);
    const response = await axios.get(`${APITXT_BASE_URL}/sendOTP`, {
      params,
      timeout: 10000,
    });

    console.log('[APITXT sendOTP Gateway Response]:', response.data);

    return {
      success: true,
      simulated: false,
      data: response.data?.data || response.data,
      gatewayMessage: response.data?.message || 'OTP Sent Successfully',
    };
  } catch (error) {
    const errorDetails = error.response?.data || error.message;
    console.error('[APITXT sendOTP Error]:', errorDetails);
    return {
      success: false,
      simulated: false,
      error: typeof errorDetails === 'object' ? JSON.stringify(errorDetails) : errorDetails,
    };
  }
}

/**
 * Send Transactional or Promotional SMS to one or multiple recipients.
 * Endpoint: https://apitxt.com/api/sendMsg
 *
 * @param {Object} params
 * @param {string|string[]} params.mobiles - Comma separated or array of 10-digit mobile numbers
 * @param {string} params.message - SMS message content
 * @param {string} [params.sender] - 6-char approved Sender ID (e.g. 'TRPVLT')
 * @param {string} [params.route] - '1' for Promotional, '4' for Transactional
 * @param {string} [params.templateId] - Approved DLT Template ID
 * @param {string} [params.peId] - Principal Entity ID (DLT)
 * @param {string} [params.schtime] - Schedule time (YYYY-MM-DD HH:mm:ss)
 * @param {number} [params.flash=0] - 0 for normal, 1 for flash
 * @param {number} [params.unicode=0] - 1 for non-English characters
 * @returns {Promise<{ success: boolean, data?: any, error?: string, simulated?: boolean }>}
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


/**
 * Check remaining APITXT account credit / wallet balance.
 * Endpoint: https://apitxt.com/api/balance
 *
 * @returns {Promise<{ success: boolean, data?: { balance: number, currency: string }, error?: string, simulated?: boolean }>}
 */
export async function checkBalance() {
  const config = getConfig();

  if (!config.authKey || config.authKey === 'your_apitxt_auth_key_here') {
    return {
      success: true,
      simulated: true,
      data: {
        balance: 999.0,
        currency: 'INR',
      },
    };
  }

  try {
    const response = await axios.get(`${APITXT_BASE_URL}/balance`, {
      params: {
        authkey: config.authKey,
      },
      timeout: 10000,
    });

    return {
      success: true,
      simulated: false,
      data: response.data?.data || response.data,
    };
  } catch (error) {
    const errorDetails = error.response?.data || error.message;
    console.error('[APITXT checkBalance Error]:', errorDetails);
    return {
      success: false,
      simulated: false,
      error: typeof errorDetails === 'object' ? JSON.stringify(errorDetails) : errorDetails,
    };
  }
}

export default {
  sendOtp,
  sendSms,
  sendTripInviteSms,
  sendExpenseAlertSms,
  checkBalance,
};
