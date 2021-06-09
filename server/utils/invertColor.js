/* http://stackoverflow.com/a/35970186 */
const padZero = (str, len) => {
  len = len || 2
  let zeros = new Array(len).join('0')

  return (zeros + str).slice(-len)
}
const getColor = (hex, bw) => {
  if (hex.indexOf('#') === 0) {
    hex = hex.slice(1)
  }

  let r = parseInt(hex.slice(0, 2), 16)
  let g = parseInt(hex.slice(2, 4), 16)
  let b = parseInt(hex.slice(4, 6), 16)

  if (bw) {
    return (r * 0.299 + g * 0.587 + b * 0.114) > 186
      ? '#000000'
      : '#FFFFFF'
  }

  r = (255 - r).toString(16)
  g = (255 - g).toString(16)
  b = (255 - b).toString(16)

  return "#" + padZero(r) + padZero(g) + padZero(b)
}

export { getColor };
