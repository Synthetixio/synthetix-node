function getApiUrl() {
  return window.localStorage.getItem('API_URL') ?? process.env.API_URL;
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

module.exports = {
  getApiUrl,
  saveToken,
};
