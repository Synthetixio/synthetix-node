function getApiUrl() {
  // TODO make as env
  // const API_URL = 'http://45.146.7.38:3005/';
  const API_URL = 'http://localhost:3005/';
  // return window.localStorage.getItem('API_URL') ?? process.env.API_URL;
  return window.localStorage.getItem('API_URL') || process.env.API_URL || API_URL;
}

function restoreToken({ walletAddress }) {
  try {
    const tokens = window.localStorage.getItem('tokens')
      ? JSON.parse(window.localStorage.getItem('tokens'))
      : {};
    return tokens[walletAddress];
  } catch (e) {
    console.error('Restore token error:', e);
    return undefined;
  }
}

function saveToken({ walletAddress, token }) {
  try {
    const tokens = window.localStorage.getItem('tokens')
      ? JSON.parse(window.localStorage.getItem('tokens'))
      : {};
    tokens[walletAddress] = token;
    window.localStorage.setItem('tokens', JSON.stringify(tokens));
  } catch (e) {
    console.error('Error saving token:', e);
  }
}

function removeToken(walletAddress) {
  try {
    const tokens = window.localStorage.getItem('tokens')
      ? JSON.parse(window.localStorage.getItem('tokens'))
      : {};

    if (tokens[walletAddress]) {
      delete tokens[walletAddress];
      window.localStorage.setItem('tokens', JSON.stringify(tokens));
    }
  } catch (e) {
    console.error('Error removing token:', e);
  }
}

module.exports = {
  getApiUrl,
  saveToken,
  removeToken,
  restoreToken,
};
