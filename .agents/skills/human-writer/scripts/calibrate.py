#!/usr/bin/env python3
"""Re-measure the author's writing fingerprint against AI-assisted and AI-generated posts.

Run from the repo root:  python3 .agents/skills/human-writer/scripts/calibrate.py
Compares posts/notes by `authored_by` (human vs ai-assisted vs ai-generated) on
sentence rhythm, dashes, contractions, pronouns, bold, numbers, and tell words.
Re-run after writing several new human posts, then update the table in SKILL.md.
Code fences, shortcodes, tables, and headings are stripped before measuring.
"""
import re,glob,statistics as st,collections,json,sys
def load(f):
    s=open(f).read()
    if not s.startswith("---"): return None,""
    h,b=s.split("\n---\n",1)[0],(s.split("\n---\n",1)[1] if "\n---\n" in s else "")
    a=re.search(r"^authored_by:\s*(\S+)",h,re.M)
    return (a.group(1) if a else None),b
def clean(b):
    b=re.sub(r"```[\s\S]*?```","",b)
    b=re.sub(r"\{%[\s\S]*?%\}","",b)
    b=re.sub(r"<[^>]+>","",b)
    b=re.sub(r"!?\[([^\]]*)\]\([^)]*\)",r"\1",b)
    b=re.sub(r"`[^`\n]*`","CODE",b)
    b=re.sub(r"^\|.*\|\s*$","",b,flags=re.M)      # tables
    b=re.sub(r"^#{1,6} .*$","",b,flags=re.M)      # headings
    b=re.sub(r"^\s*(---|\*\*\*)\s*$","",b,flags=re.M)
    return b
files=glob.glob("src/posts/**/*.md",recursive=True)+glob.glob("src/notes/*.md")
files=[f for f in files if "template" not in f and not f.split("/")[-1].startswith("_")]
groups=collections.defaultdict(list)
for f in files:
    a,b=load(f)
    if a: groups[a].append((f,b))
print({k:len(v) for k,v in groups.items()})
def metrics(b):
    raw=b
    t=clean(b)
    words=re.findall(r"[A-Za-z0-9'’]+",t)
    n=len(words)
    if n<150: return None
    sents=[s for s in re.split(r"(?<=[.!?])\s+(?=[A-Z\"“*(\[])",re.sub(r"\n+"," ",t)) if len(s.split())>=2]
    sl=[len(s.split()) for s in sents]
    per=lambda c:1000*c/n
    paras=[p for p in re.split(r"\n\s*\n",t) if len(p.split())>3]
    pl=[len(p.split()) for p in paras]
    m={}
    m["words"]=n
    m["sent_mean"]=st.mean(sl) if sl else 0
    m["sent_median"]=st.median(sl) if sl else 0
    m["sent_sd"]=st.pstdev(sl) if len(sl)>1 else 0
    m["short<=6_pct"]=100*sum(1 for x in sl if x<=6)/len(sl) if sl else 0
    m["long>=30_pct"]=100*sum(1 for x in sl if x>=30)/len(sl) if sl else 0
    m["para_mean"]=st.mean(pl) if pl else 0
    m["emdash/1k"]=per(len(re.findall("—",raw)))
    m["spaced_hyphen_dash/1k"]=per(len(re.findall(r"\s-\s",t))+len(re.findall(r"\s--\s",t)))
    m["contractions/1k"]=per(len(re.findall(r"\b\w+(?:n't|'re|'ve|'ll|'m|'d|’re|’ve|’ll|’m|’d|n’t)\b",t))+len(re.findall(r"\b(?:it|that|he|she|there|what|here|let)['’]s\b",t,re.I)))
    m["I/me/my/1k"]=per(len(re.findall(r"\b(I|me|my|I'm|I've|I'd|I'll|mine|myself)\b",t)))
    m["you/1k"]=per(len(re.findall(r"\b(you|your|you're)\b",t,re.I)))
    m["we/1k"]=per(len(re.findall(r"\b(we|our|us|let's)\b",t,re.I)))
    m["parens/1k"]=per(len(re.findall(r"\([^)\n]{3,}\)",t)))
    m["questions/1k"]=per(t.count("?"))
    m["exclaim/1k"]=per(t.count("!"))
    m["bold/1k"]=per(len(re.findall(r"\*\*[^*\n]+\*\*",raw)))
    m["italic/1k"]=per(len(re.findall(r"(?<!\*)\*[^*\n]+\*(?!\*)",raw)))
    m["bullets/1k"]=per(len(re.findall(r"^\s*[-*] ",raw,re.M)))
    m["not_x_but_y/1k"]=per(len(re.findall(r"\b(?:isn't|is not|aren't|not just|not only|wasn't|doesn't|don't)\b[^.!?\n]{0,60}\b(?:it's|but|it is|they're|rather)\b",t,re.I)))
    m["triads/1k"]=per(len(re.findall(r"\b[\w-]+, [\w-]+,? and [\w-]+\b",t)))
    m["tho/lol/haha/man/1k"]=per(len(re.findall(r"\b(tho|lol|haha|btw|imo|tbh|yaa+|ngl)\b",t,re.I)))
    m["swear/1k"]=per(len(re.findall(r"\b(fuck\w*|shit\w*|damn|crap|hell|ass)\b",t,re.I)))
    m["start_I_pct"]=100*sum(1 for s in sents if s.startswith(("I ","I'","I’")))/len(sents) if sents else 0
    m["start_But_And_So_pct"]=100*sum(1 for s in sents if re.match(r"(But|And|So|Also|Still|Yet|Plus)\b",s))/len(sents) if sents else 0
    m["frag<=3w_pct"]=100*sum(1 for x in sl if x<=3)/len(sl) if sl else 0
    m["numbers/1k"]=per(len(re.findall(r"\b\d[\d,.]*\b",t)))
    m["links/1k"]=per(len(re.findall(r"\]\(http",raw)))
    return m
tell=["delve","tapestry","landscape","journey","leverage","robust","pivotal","crucial","seamless","testament","underscore","vibrant","navigate","realm","furthermore","moreover","additionally","notably","importantly","ultimately","essentially","it's worth noting","it is worth noting","game-changer","unlock","elevate","comprehensive","crucially","stunning","breathtaking","colossal","astonishing","remarkable","incredible"]
out={}
for g,items in groups.items():
    ms=[m for m in (metrics(b) for f,b in items) if m]
    if not ms: continue
    out[g]={k:round(st.mean(m[k] for m in ms),2) for k in ms[0]}
    out[g]["n_docs"]=len(ms)
    alltext=" ".join(clean(b).lower() for f,b in items)
    nw=len(re.findall(r"\w+",alltext))
    out[g]["tells/1k"]=round(1000*sum(alltext.count(w) for w in tell)/nw,2)
keys=list(out["human"].keys())
print("%-24s"%"metric",*["%12s"%g for g in out])
for k in keys: print("%-24s"%k,*["%12s"%out[g].get(k) for g in out])
# per-word tells in human
h=" ".join(clean(b).lower() for f,b in groups["human"])
print("\nhuman tell words:",{w:h.count(w) for w in tell if h.count(w)})
a=" ".join(clean(b).lower() for f,b in groups.get("ai-assisted",[]))
print("ai-assisted tell words:",{w:a.count(w) for w in tell if a.count(w)})

