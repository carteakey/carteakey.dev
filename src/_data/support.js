const DEFAULT_PROVIDER = 'Ko-fi';
const DEFAULT_URL = 'https://ko-fi.com/carteakey';

function isSafeSupportUrl(value) {
  if (!value) return false;

  try {
    return new URL(value).protocol === 'https:';
  } catch {
    return false;
  }
}

export default function () {
  const url = process.env.SUPPORT_URL?.trim() || DEFAULT_URL;
  const provider = process.env.SUPPORT_PROVIDER?.trim() || DEFAULT_PROVIDER;
  const methods = [{ provider, url, icon: 'coffee', detail: 'One-off tips' }]
    .filter((method) => isSafeSupportUrl(method.url));

  return {
    methods,
  };
}
