function isAscii(str) {
  return /^[\x00-\x7F]*$/.test(str);
}

function asciiStringToBytes32(str) {
  if (str.length > 32 || !isAscii(str)) {
    throw new Error("Invalid label, must be less than 32 characters");
  }

  return "0x" + Buffer.from(str, "ascii").toString("hex").padEnd(64, "0");
}

module.exports = { isAscii, asciiStringToBytes32 };
