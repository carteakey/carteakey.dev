class YAMLError(Exception):
  pass


def safe_load(text):
  data = {}
  for raw_line in text.splitlines():
    line = raw_line.strip()
    if not line:
      continue
    if ":" not in line:
      raise YAMLError(f"invalid line: {raw_line}")
    key, value = line.split(":", 1)
    data[key.strip()] = value.strip().strip('"\'')
  return data
