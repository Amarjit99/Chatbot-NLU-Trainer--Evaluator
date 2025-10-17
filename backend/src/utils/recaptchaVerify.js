import axios from 'axios';

/**
 * Verify Google reCAPTCHA token
 * @param {string} token - The reCAPTCHA token from the client
 * @returns {Promise<boolean>} - True if verification succeeds, false otherwise
 */
export async function verifyRecaptcha(token) {
  // For development/testing, you can bypass verification
  // Remove or comment out this block in production
  if (process.env.SKIP_RECAPTCHA === 'true') {
    console.log('⚠️  Skipping reCAPTCHA verification (development mode)');
    return true;
  }

  if (!token) {
    console.error('❌ No reCAPTCHA token provided');
    return false;
  }

  try {
    const secretKey = process.env.RECAPTCHA_SECRET_KEY || '6LeIxAcTAAAAAGG-vFI1TnRWxMZNFuojJ4WifJWe'; // Test secret key
    
    console.log('🔍 Verifying reCAPTCHA...');
    console.log('   Secret Key:', secretKey.substring(0, 15) + '...');
    console.log('   Token:', token.substring(0, 20) + '...');
    
    const response = await axios.post(
      'https://www.google.com/recaptcha/api/siteverify',
      null,
      {
        params: {
          secret: secretKey,
          response: token,
        },
      }
    );

    const { success, score, 'error-codes': errorCodes, hostname } = response.data;
    
    console.log('📡 reCAPTCHA API Full Response:', JSON.stringify(response.data, null, 2));

    if (!success) {
      console.error('❌ reCAPTCHA verification failed!');
      console.error('   Error Codes:', errorCodes);
      console.error('   Hostname:', hostname);
      
      if (errorCodes && errorCodes.includes('invalid-input-secret')) {
        console.error('⚠️  SECRET KEY is invalid! Check your RECAPTCHA_SECRET_KEY in .env');
        console.error('   Current Secret Key:', secretKey);
      }
      if (errorCodes && errorCodes.includes('invalid-input-response')) {
        console.error('⚠️  Token is invalid! Possible causes:');
        console.error('   1. Site Key and Secret Key don\'t match');
        console.error('   2. Token already used or expired');
        console.error('   3. Domain not registered in reCAPTCHA settings');
      }
      if (errorCodes && errorCodes.includes('missing-input-secret')) {
        console.error('⚠️  SECRET KEY is missing!');
      }
      if (errorCodes && errorCodes.includes('missing-input-response')) {
        console.error('⚠️  reCAPTCHA token is missing!');
      }
      
      // For development, log detailed help
      console.error('\n🔧 DEBUG HELP:');
      console.error('   1. Check that localhost is added to your reCAPTCHA domains');
      console.error('   2. Visit: https://www.google.com/recaptcha/admin');
      console.error('   3. Find site with keys starting: 6Lc33-0r');
      console.error('   4. Add "localhost" to domains list');
      console.error('   5. OR set SKIP_RECAPTCHA=true in .env for development\n');
      
      return false;
    }

    // For reCAPTCHA v2, success is boolean
    // For reCAPTCHA v3, you might want to check the score
    // if (score && score < 0.5) {
    //   console.warn('reCAPTCHA score too low:', score);
    //   return false;
    // }

    console.log('✅ reCAPTCHA verification successful');
    return true;
  } catch (error) {
    console.error('Error verifying reCAPTCHA:', error.message);
    return false;
  }
}
