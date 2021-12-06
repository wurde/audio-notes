export default function parseLocationParams(string) {
  const params = {};
  const query = string.substring(1);
  const vars = query.split('&');

  for (let i = 0; i < vars.length; i += 1) {
    const pair = vars[i].split('=');
    params[decodeURIComponent(pair[0])] = decodeURIComponent(pair[1]);
  }

  return params;
}
