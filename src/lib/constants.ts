const patterns = {
  zeroTo9999: /^(|0|0\.\d{0,2}|[1-9]\d{0,3}(\.\d{0,2})?)$/,
  email: /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/,
  minimumOneUpperCaseLetter: /[A-Z]/,
  minimumOneLowerCaseLetter: /[a-z]/,
  minimumOneDigit: /[0-9]/,
  minimumOneSpecialCharacter: /[@$!%*#?&]/,
  minEightCharacters: /^.{8,}$/,
};

const TIME_ZONE = "Asia/Shanghai";
const TIME_ZONE_OFFSET = "+08:00";

export { patterns, TIME_ZONE, TIME_ZONE_OFFSET };