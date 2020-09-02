const CryptoJS = require('crypto-js');
const decryptKey = "jwtexample";

module.exports = data => {
  let decipher = CryptoJS.AES.decrypt(data, decryptKey);
  decipher = decipher.toString(CryptoJS.enc.Utf8);
  return decipher;
}