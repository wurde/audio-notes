function addZero(i) {
  if (i < 10) { i = "0" + i }
  return i;
}

export default function createAudioNoteName() {
  const date = new Date();

  const year = addZero(date.getFullYear());
  const month = addZero(date.getMonth() + 1);
  const day = addZero(date.getDate());

  const hour = addZero(date.getHours());
  const minute = addZero(date.getMinutes());
  const second = addZero(date.getSeconds());

  return `${year}${month}${day}-${hour}${minute}${second}`;
}
