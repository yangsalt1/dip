import 'server-only';
import type { HUnit, Notice, Who } from './types';
import { todayKst } from './calc';
import { extractText, getDocumentProxy } from 'unpdf';

/**
 * 공고 모으기 (키 필요 없음: 각 사이트의 공개 목록 페이지를 읽어요)
 *   청약홈 아파트 분양 · 청약홈 무순위/잔여 · LH 임대/분양 · 서울 청년안심주택
 */
const UA = 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/130 Safari/537.36';
const AH = 'https://www.applyhome.co.kr';
const LH = 'https://apply.lh.or.kr';
const SOCO = 'https://soco.seoul.go.kr';

async function get(url: string, init?: RequestInit) {
  const r = await fetch(url, { ...init, headers: { 'user-agent': UA, accept: '*/*', ...(init?.headers ?? {}) }, cache: 'no-store', signal: AbortSignal.timeout(12000) });
  if (!r.ok) throw new Error(`${r.status} ${url}`);
  return r.text();
}

const strip = (s: string) => s.replace(/<[^>]+>/g, ' ').replace(/&nbsp;/g, ' ').replace(/&middot;/g, '·').replace(/&amp;/g, '&').replace(/\s+/g, ' ').trim();
const tds = (row: string) => [...row.matchAll(/<t[dh][^>]*>([\s\S]*?)<\/t[dh]>/g)].map((m) => strip(m[1]));
const num = (s?: string) => { const n = Number(String(s ?? '').replace(/[^\d.]/g, '')); return Number.isFinite(n) && n > 0 ? n : undefined; };
const day = (s?: string) => { const m = String(s ?? '').match(/(\d{4})[.\-/](\d{1,2})[.\-/](\d{1,2})/); return m ? `${m[1]}-${m[2].padStart(2, '0')}-${m[3].padStart(2, '0')}` : undefined; };
const range = (s?: string) => { const d = [...String(s ?? '').matchAll(/\d{4}[.\-/]\d{1,2}[.\-/]\d{1,2}/g)].map((m) => day(m[0])!); return { start: d[0], end: d[1] ?? d[0] }; };

const SIDO: Record<string, string> = {
  서울특별시: '서울', 서울시: '서울', 경기도: '경기', 인천광역시: '인천', 부산광역시: '부산', 대구광역시: '대구', 대전광역시: '대전', 광주광역시: '광주', 울산광역시: '울산',
  세종특별자치시: '세종', 강원특별자치도: '강원', 강원도: '강원', 충청북도: '충북', 충청남도: '충남', 전북특별자치도: '전북', 전라북도: '전북', 전라남도: '전남', 경상북도: '경북', 경상남도: '경남', 제주특별자치도: '제주',
};
export const SIDO_LIST = ['서울', '경기', '인천', '부산', '대구', '대전', '광주', '울산', '세종', '강원', '충북', '충남', '전북', '전남', '경북', '경남', '제주'];
const sidoOf = (s: string) => SIDO[s.trim()] ?? (SIDO_LIST.find((x) => s.startsWith(x)) || s.trim().slice(0, 2));
function guOf(addr?: string) {
  const t = String(addr ?? '').split(/\s+/);
  return t[1] && /[시군구]$/.test(t[1]) ? t[1] : undefined;
}

/** 이름에 있는 말로 누구를 위한 집인지 */
function whoByWords(text: string, base: Who[]): Who[] {
  const w = new Set<Who>(base);
  if (/청년|대학생|사회초년/.test(text)) w.add('youth');
  if (/신혼|신생아|예비부부/.test(text)) w.add('newlywed');
  if (/다자녀|신생아|아동|가정|다가구/.test(text)) w.add('family');
  return [...w];
}

/* ───────── 청약홈 공식 데이터 (공공데이터포털 키가 있을 때) ───────── */
const ODC = 'https://api.odcloud.kr/api/ApplyhomeInfoDetailSvc/v1/';
async function odc(op: string, cond: Record<string, string>, perPage = 100): Promise<Record<string, unknown>[]> {
  const key = process.env.DATA_GO_KR_KEY;
  if (!key) return [];
  const q = new URLSearchParams({ page: '1', perPage: String(perPage), serviceKey: key });
  for (const [k, v] of Object.entries(cond)) q.set(`cond[${k}]`, v);
  const j = JSON.parse(await get(`${ODC}${op}?${q}`));
  return (j?.data ?? []) as Record<string, unknown>[];
}
const str = (v: unknown) => (v == null ? '' : String(v));
const ymd = (v: unknown) => { const t = str(v).replace(/\D/g, ''); return t.length >= 8 ? `${t.slice(0, 4)}-${t.slice(4, 6)}-${t.slice(6, 8)}` : undefined; };
const ym = (v: unknown) => { const t = str(v).replace(/\D/g, ''); return t.length >= 6 ? `${t.slice(0, 4)}.${t.slice(4, 6)}` : undefined; };

/** 무순위(줍줍) 주택형별 면적·분양가 */
async function remndrUnits(n: Notice) {
  const hm = n.id.split('-')[1];
  const [d] = await odc('getRemndrLttotPblancDetail', { 'HOUSE_MANAGE_NO::EQ': hm }, 1);
  if (d) {
    n.addr = str(d.HSSPLY_ADRES) || n.addr; n.gu = guOf(n.addr);
    n.move = ym(d.MVN_PREARNGE_YM) ?? n.move; n.win = ymd(d.PRZWNER_PRESNATN_DE) ?? n.win;
    if (d.PBLANC_URL) n.url = str(d.PBLANC_URL);
    if (d.MDHS_TELNO) n.tel = str(d.MDHS_TELNO);
  }
  const rows = await odc('getRemndrLttotPblancMdl', { 'HOUSE_MANAGE_NO::EQ': hm });
  n.units = rows.map((r) => ({
    ty: str(r.HOUSE_TY).replace(/^0*(\d+)\.\d+/, '$1'), area: Number(str(r.HOUSE_TY).match(/^[\d.]+/)?.[0] ?? 0),
    supply: num(str(r.SUPLY_AR)), count: num(str(r.SUPLY_HSHLDCO)), price: num(str(r.LTTOT_TOP_AMOUNT)),
  })).filter((u) => u.area > 0);
}

/** 공공지원 민간임대 (청약홈) */
async function pvtList(): Promise<Notice[]> {
  const today = todayKst().replace(/-/g, '');
  const rows = await odc('getPblPvtRentLttotPblancDetail', { 'SUBSCRPT_RCEPT_ENDDE::GTE': today });
  return rows.map((r) => {
    const addr = str(r.HSSPLY_ADRES);
    return {
      id: `pv-${r.HOUSE_MANAGE_NO}-${r.PBLANC_NO}`, src: 'pvt', kind: 'rent', cat: '공공지원 민간임대',
      name: str(r.HOUSE_NM).replace(/\(공공지원민간임대\)/, '').trim(), sido: sidoOf(str(r.SUBSCRPT_AREA_CODE_NM) || addr.split(' ')[0]), addr, gu: guOf(addr),
      posted: ymd(r.RCRIT_PBLANC_DE), start: ymd(r.SUBSCRPT_RCEPT_BGNDE), end: ymd(r.SUBSCRPT_RCEPT_ENDDE), win: ymd(r.PRZWNER_PRESNATN_DE), move: ym(r.MVN_PREARNGE_YM),
      url: str(r.PBLANC_URL) || `${AH}`, tel: str(r.MDHS_TELNO) || undefined, who: ['general'], units: [],
      note: '일반공급은 소득·자산 기준이 없는 경우가 많아요 · 금액은 보증금(최대) 기준, 월세는 공고문 확인',
    } as Notice;
  });
}
async function pvtUnits(n: Notice) {
  const hm = n.id.split('-')[1];
  const rows = await odc('getPblPvtRentLttotPblancMdl', { 'HOUSE_MANAGE_NO::EQ': hm });
  n.units = rows.map((r) => ({
    ty: str(r.TP), area: num(str(r.EXCLUSE_AR)) ?? 0, supply: num(str(r.SUPLY_AR)), count: num(str(r.SUPLY_HSHLDCO)), deposit: num(str(r.SUPLY_AMOUNT)),
    sp: { newlywed: Number(r.SPSPLY_NEW_MRRG_HSHLDCO) || 0, youth: Number(r.SPSPLY_YGMN_HSHLDCO) || 0 },
  })).filter((u) => u.area > 0);
  const who = new Set<Who>(['general']);
  for (const u of n.units) { if (u.sp?.newlywed) who.add('newlywed'); if (u.sp?.youth) who.add('youth'); }
  n.who = [...who];
}

/* ───────── 청약홈 (아파트 분양) ───────── */
async function applyhomeList(): Promise<Notice[]> {
  const out: Notice[] = [];
  for (const page of [1, 2]) {
    let html: string;
    try { html = await get(`${AH}/ai/aia/selectAPTLttotPblancListView.do?pageIndex=${page}`); } catch { break; }
    for (const m of html.matchAll(/<tr data-pbno="(\d+)" data-hmno="(\d+)"[^>]*data-honm="([^"]*)"[^>]*>([\s\S]*?)<\/tr>/g)) {
      const c = tds(m[4]); // 지역, 민영/국민, 분양/임대, 주택명, 시공사, 문의, 공고일, 청약기간, 발표
      const { start, end } = range(c[7]);
      const pb = m[1], hm = m[2];
      out.push({
        id: `ah-${hm}-${pb}`, src: 'applyhome', kind: /임대/.test(c[2]) ? 'rent' : 'sale',
        cat: `아파트 ${/임대/.test(c[2]) ? '임대' : '분양'}${c[1] === '국민' ? ' (공공)' : ''}`,
        name: m[3] || c[3], sido: sidoOf(c[0]), posted: day(c[6]), start, end, win: day(c[8]), tel: c[5]?.replace(/[^\d-]/g, '') || undefined,
        url: `${AH}/ai/aia/selectAPTLttotPblancDetail.do?houseManageNo=${hm}&pblancNo=${pb}`, who: ['general'], units: [],
      });
    }
  }
  return out;
}

async function remndrList(): Promise<Notice[]> {
  const out: Notice[] = [];
  let html: string;
  try { html = await get(`${AH}/ai/aia/selectAPTRemndrLttotPblancListView.do`); } catch { return out; }
  for (const m of html.matchAll(/<tr data-pbno="(\d+)" data-hmno="(\d+)" data-hsecd="(\d+)" data-honm="([^"]*)"[^>]*>([\s\S]*?)<\/tr>/g)) {
    const c = tds(m[5]); // 지역, 구분, 주택명, 시행사, 공고일, 청약기간, 발표
    const { start, end } = range(c[5]);
    out.push({
      id: `rm-${m[2]}-${m[1]}`, src: 'remndr', kind: 'sale', cat: c[1] ? `${c[1]} (줍줍)` : '무순위 (줍줍)',
      name: m[4] || c[2], sido: sidoOf(c[0]), posted: day(c[4]), start, end, win: day(c[6]),
      url: `${AH}/ai/aia/selectAPTRemndrLttotPblancDetailView.do?houseManageNo=${m[2]}&pblancNo=${m[1]}`, who: ['general'], units: [],
      note: '청약통장·자격 상관없이 누구나 신청하는 경우가 많아요 (공고문 확인)',
    });
  }
  return out;
}

/** 청약홈 상세: 주소, 주택형별 면적·세대수·특별공급·분양가, 입주월 */
export async function applyhomeDetail(n: Notice): Promise<Notice> {
  const html = await get(n.url);
  const addr = html.match(/공급위치\s*<\/td>\s*<td[^>]*>([\s\S]*?)<\/td>/)?.[1];
  if (addr) { n.addr = strip(addr); n.gu = guOf(n.addr); }
  n.doc = html.match(/href="(https:\/\/static\.applyhome\.co\.kr\/ai\/aia\/getAtchmnfl\.do[^"]+)"/)?.[1]?.replace(/&amp;/g, '&');
  const mv = html.match(/입주예정월\s*:\s*([\d.]+)/)?.[1];
  if (mv) n.move = mv;
  const units = new Map<string, HUnit>();
  const tables = html.split('<table').slice(1);
  for (const t of tables) {
    const body = t.split('</table>')[0];
    const rows = [...body.matchAll(/<tr[^>]*>([\s\S]*?)<\/tr>/g)].map((r) => r[1]);
    if (/주택공급면적/.test(body)) {
      for (const r of rows) {
        const c = tds(r); const i = c.findIndex((x) => /^\d{2,3}\.\d+\w*$/.test(x));
        if (i < 0) continue;
        units.set(c[i], { ty: c[i], area: Number(c[i].match(/^[\d.]+/)![0]), supply: num(c[i + 1]), count: num(c[i + 4]) ?? num(c[i + 2]) });
      }
    } else if (/다자녀/.test(body) && /신혼/.test(body)) {
      const head = [...body.matchAll(/<th[^>]*>([\s\S]*?)<\/th>/g)].map((h) => strip(h[1]).replace(/\s/g, ''));
      const cols = head.slice(head.findIndex((h) => h.startsWith('다자녀')));
      for (const r of rows) {
        const c = tds(r); if (!/^\d{2,3}\.\d+/.test(c[0] ?? '')) continue;
        const u = units.get(c[0]); if (!u) continue;
        const v = (name: RegExp) => { const k = cols.findIndex((h) => name.test(h)); return k >= 0 ? num(c[k + 1]) ?? 0 : 0; };
        u.sp = { newlywed: v(/신혼/), youth: v(/청년/), family: v(/다자녀/) + v(/신생아/), first: v(/생애최초/) };
      }
    } else if (/공급금액/.test(body)) {
      for (const r of rows) {
        const c = tds(r); if (!/^\d{2,3}\.\d+/.test(c[0] ?? '')) continue;
        const u = units.get(c[0]); if (u) u.price = num(c[1]);
      }
    }
  }
  n.units = [...units.values()];
  const who = new Set<Who>(['general']);
  for (const u of n.units) {
    if (u.sp?.newlywed) who.add('newlywed');
    if (u.sp?.youth) who.add('youth');
    if (u.sp?.family) who.add('family');
  }
  n.who = [...who];
  // 같은 이름 주택형은 면적만 살짝 다른 경우가 많아서 짧게: 059.9906A → 59A
  for (const u of n.units) u.ty = u.ty.replace(/^0*(\d+)\.\d+/, '$1');
  return n;
}

/* ───────── LH (임대 · 분양) ───────── */
async function lhList(): Promise<Notice[]> {
  const out: Notice[] = [];
  const seen = new Set<string>();
  for (const mi of ['1026', '1027']) {
    for (const page of [1, 2, 3]) {
      let html: string;
      try { html = await get(`${LH}/lhapply/apply/wt/wrtanc/selectWrtancList.do?mi=${mi}&currPage=${page}`); } catch { break; }
      let found = 0;
      for (const m of html.matchAll(/<tr>([\s\S]*?)<\/tr>/g)) {
        const r = m[1];
        const a = r.match(/data-id1="(\d+)" data-id2="(\d+)" data-id3="(\d+)" data-id4="(\d+)"/);
        if (!a) continue;
        found++;
        const [, pan, ccr, upp, ais] = a;
        if (seen.has(pan)) continue; seen.add(pan);
        const cat = strip(r.match(/cate col1">([\s\S]*?)<\/td>/)?.[1] ?? '');
        if (/상가|토지|어린이집/.test(cat)) continue;
        const title = strip((r.match(/<span>([\s\S]*?)<em/)?.[1] ?? r.match(/<span>([\s\S]*?)<\/span>/)?.[1] ?? ''));
        const region = strip(r.match(/cate col2">([\s\S]*?)<\/td>/)?.[1] ?? '');
        const c = tds(r);
        const dates = c.filter((x) => /^\d{4}\.\d{2}\.\d{2}$/.test(x));
        const status = strip(r.match(/stt[^"]*">([\s\S]*?)<\/td>/)?.[1] ?? '');
        if (/마감|완료/.test(status)) continue;
        const sale = /분양/.test(cat) && !/임대/.test(cat);
        const base: Who[] = /행복주택/.test(cat) ? ['youth', 'newlywed'] : /신혼희망/.test(cat) ? ['newlywed', 'family'] : /청년/.test(cat) ? ['youth'] : ['general', 'family'];
        out.push({
          id: `lh-${pan}`, src: 'lh', kind: sale ? 'sale' : 'rent', cat: cat || 'LH', name: title.replace(/^\[[^\]]*공고\]\s*/, ''), sido: sidoOf(region),
          posted: day(dates[0]), end: day(dates[1]), who: whoByWords(title + cat, base), units: [],
          url: `${LH}/lhapply/apply/wt/wrtanc/selectWrtancInfo.do?panId=${pan}&ccrCnntSysDsCd=${ccr}&uppAisTpCd=${upp}&aisTpCd=${ais}&mi=${mi}`,
        });
      }
      if (!found) break;
    }
  }
  return out;
}

/** LH 상세: 주소, 주택형별 면적·세대수·보증금·월세, 접수기간 */
export async function lhDetail(n: Notice): Promise<Notice> {
  const html = await get(n.url);
  const addr = html.match(/소재지\s*:\s*([^<]+)</)?.[1];
  if (addr) { n.addr = addr.trim(); n.gu = guOf(n.addr); if (!SIDO_LIST.includes(n.sido)) n.sido = sidoOf(n.addr.split(' ')[0]); }
  const acp = html.match(/sta_acpDt">([^<]*)</)?.[1];
  if (acp && /\d/.test(acp)) { const r = range(acp); n.start = r.start; n.end = r.end ?? n.end; }
  const win = html.match(/sta_pzwrDt">([^<]*)</)?.[1]; if (win) n.win = day(win);
  const mv = html.match(/입주예정월\s*:\s*([\d.]+)/)?.[1]; if (mv) n.move = mv;
  const units: HUnit[] = [];
  for (const t of html.split('<table').slice(1)) {
    const body = t.split('</table>')[0];
    if (!/전용면적/.test(body) || !/(임대보증금|분양가|공급가)/.test(body)) continue;
    const head = [...body.matchAll(/<th[^>]*>([\s\S]*?)<\/th>/g)].map((h) => strip(h[1]));
    const iDep = head.findIndex((h) => /임대보증금|분양가|공급가/.test(h));
    const iRent = head.findIndex((h) => /월임대료/.test(h));
    for (const r of [...body.matchAll(/<tr[^>]*>([\s\S]*?)<\/tr>/g)].map((x) => x[1])) {
      const c = tds(r); if (c.length < 4 || !num(c[1])) continue;
      const won2man = (s?: string) => { const v = num(s); return v ? Math.round(v / 10000) : undefined; };
      const u: HUnit = { ty: c[0].replace(/\(.*\)/, '').trim().replace(/^0*(\d+)\.\d+/, '$1'), area: num(c[1])!, count: num(c[2]) };
      if (n.kind === 'sale') u.price = won2man(c[iDep]); else { u.deposit = won2man(c[iDep]); u.rent = iRent >= 0 ? won2man(c[iRent]) : undefined; }
      if (!units.some((x) => x.ty === u.ty && x.area === u.area)) units.push(u);
      n.who = whoByWords(c[0], n.who);
    }
  }
  n.units = units;
  return n;
}

/* ───────── 서울 청년안심주택 ───────── */
async function socoList(): Promise<Notice[]> {
  const out: Notice[] = [];
  for (const page of [1, 2]) {
    let j: { resultList?: Record<string, unknown>[] };
    try {
      const t = await get(`${SOCO}/youth/pgm/home/yohome/bbsListJson.json`, {
        method: 'POST',
        headers: { 'content-type': 'application/x-www-form-urlencoded; charset=UTF-8', 'x-requested-with': 'XMLHttpRequest' },
        body: `bbsId=BMSR00015&pageIndex=${page}&searchAdresGu=&searchCondition=&searchKeyword=&optn2=&optn5=`,
      });
      j = JSON.parse(t);
    } catch { break; }
    for (const r of j.resultList ?? []) {
      const title = String(r.nttSj ?? '');
      if (/결과|당첨|발표|경쟁률|안내$|서류/.test(title) && !/모집/.test(title)) continue;
      const html = String(r.content ?? '');
      const text = strip(html);
      const addr = text.match(/(?:주택위치|위치|소재지)\s*:\s*(서울[^■(]+)/)?.[1]?.trim();
      const posted = day(String(r.optn1 ?? ''));
      const end = day(String(r.optn4 ?? ''));
      const units: HUnit[] = [];
      // 본문 표에 면적·보증금·월세가 있으면 읽어요
      for (const row of html.matchAll(/<tr[^>]*>([\s\S]*?)<\/tr>/g)) {
        const c = tds(row[1]);
        const area = c.map((x) => num(x)).find((v) => v && v > 10 && v < 120);
        const money = c.filter((x) => /[\d,]{4,}/.test(x)).map((x) => num(x)!).filter((v) => v > 100);
        if (area && money.length >= 2 && /㎡|형/.test(c.join(' '))) {
          const [dep, rent] = money.slice(-2);
          const toMan = (v: number) => (v > 1e6 ? Math.round(v / 10000) : v > 1000 && v < 1e5 ? v : Math.round(v / 10000));
          units.push({ ty: c[0], area, deposit: toMan(dep), rent: toMan(rent) });
        }
      }
      out.push({
        id: `soco-${r.boardId}`, src: 'soco', kind: 'rent', cat: String(r.optn2) === '1' ? '청년안심주택 (공공임대)' : '청년안심주택 (민간임대)',
        name: title.replace(/^\[[^\]]+\]\s*/, '').replace(/\s*(입주자\s*)?(추가\s*)?모집\s*공고.*$/, '').trim() || title,
        sido: '서울', addr, gu: guOf(addr), posted, end, who: ['youth', 'newlywed'], units,
        url: `${SOCO}/youth/bbs/BMSR00015/view.do?boardId=${r.boardId}&menuNo=400008`,
        note: /민간임대/.test(title) || String(r.optn2) !== '1' ? '민간임대 일반공급은 소득·자산 기준이 없는 경우가 많아요 (공고문 확인)' : undefined,
      });
    }
  }
  return out;
}

/** 청년안심주택: 공고문 PDF에서 면적·보증금·월세 읽기 */
export function parseSupply(text: string): HUnit[] {
  const out: HUnit[] = [];
  // 면적(㎡) 뒤에 오는 숫자 중 보증금·월세처럼 생긴 것 (만원이면 500~10만, 원이면 500만 이상)
  const re = /(\d{2,3}\.\d{1,4})\s*(?:㎡|m²|m2)\s*(?:\(\s*([0-9A-Za-z\-]+)\s*\))?([\s\S]{0,200})/g;
  for (const m of text.matchAll(re)) {
    const area = Number(m[1]);
    if (!(area > 10 && area < 130)) continue;
    const tail = m[3].split(/\d{2,3}\.\d{1,4}\s*(?:㎡|m²|m2)/)[0].replace(/\d+\s*(호|층|세대|개|명|%|년|월|일)/g, ' ').replace(/\d{4}[.\-]\s*\d{1,2}[.\-]\s*\d{1,2}/g, ' ');
    const nums = [...tail.matchAll(/\d{1,3}(?:,\d{3})+|\d+/g)].map((x) => Number(x[0].replace(/,/g, ''))).filter((v) => v > 0);
    let dep: number | undefined, rent: number | undefined;
    const iw = nums.findIndex((v) => v >= 5e6 && v < 2e9);
    if (iw >= 0) {
      dep = Math.round(nums[iw] / 1e4);
      const r = nums.slice(iw + 1).find((v) => v >= 1e4 && v < 5e6); rent = r ? Math.round(r / 1e4) : undefined;
    } else {
      const im = nums.findIndex((v) => v >= 500 && v < 100000);
      if (im < 0) continue;
      dep = nums[im]; rent = nums.slice(im + 1).find((v) => v >= 5 && v < 500);
    }
    if (!dep) continue;
    const ty = m[2] || `${Math.round(area)}㎡`;
    if (!out.some((u) => u.ty === ty && u.area === area)) out.push({ ty, area, deposit: dep, rent });
    if (out.length >= 12) break;
  }
  return out;
}
async function socoUnits(n: Notice) {
  const html = await get(n.url);
  const files = [...html.matchAll(/href="(\/coHouse\/cmmn\/file\/fileDown\.do\?atchFileId=[^"&]+&(?:amp;)?fileSn=\d+)"\s*>([^<]+)</g)];
  const pick = files.find((f) => /\.pdf/i.test(f[2]) && /공고/.test(f[2])) ?? files.find((f) => /\.pdf/i.test(f[2]));
  if (!pick) return;
  n.doc = `${SOCO}${pick[1].replace(/&amp;/g, '&')}`;
  const r = await fetch(n.doc, { headers: { 'user-agent': UA }, cache: 'no-store', signal: AbortSignal.timeout(15000) });
  if (!r.ok) return;
  const pdf = await getDocumentProxy(new Uint8Array(await r.arrayBuffer()));
  const { text } = await extractText(pdf, { mergePages: true });
  const t = String(text);
  n.units = parseSupply(t);
  if (!n.addr) { const a = t.match(/주택\s*위치\s*[:：]\s*(서울[^\n(]+)/)?.[1]?.trim(); if (a) { n.addr = a; n.gu = guOf(a); } }
  const mv = t.match(/입주\s*(?:지정|예정)[^\n]{0,10}?(\d{4})\.\s*(\d{1,2})\./); if (mv && !n.move) n.move = `${mv[1]}.${mv[2].padStart(2, '0')}`;
}

async function pool<T>(items: T[], n: number, fn: (x: T) => Promise<void>) {
  let i = 0;
  await Promise.all(Array.from({ length: n }, async () => { while (i < items.length) { const x = items[i++]; try { await fn(x); } catch { /* 이 공고는 목록 정보만 */ } } }));
}

/** 전체 모으기. old = 지난번 결과 (상세는 다시 안 불러요) */
export async function collect(old: Record<string, Notice> = {}): Promise<Notice[]> {
  const today = todayKst();
  const lists = await Promise.allSettled([applyhomeList(), remndrList(), lhList(), socoList(), pvtList()]);
  let all = lists.flatMap((r) => (r.status === 'fulfilled' ? r.value : []));
  // 아직 접수가 안 끝난 것만 (마감일 모르면 최근 30일 공고)
  all = all.filter((n) => (n.end ? n.end >= today : (n.posted ?? '') >= todayKst(new Date(Date.now() - 30 * 864e5))));
  const need: Notice[] = [];
  all = all.map((n) => {
    const o = old[n.id];
    if (o && o.units.length) return { ...n, ...o, end: n.end ?? o.end };
    need.push(n);
    return n;
  });
  await pool(need, 5, async (n) => {
    if (n.src === 'applyhome') await applyhomeDetail(n);
    else if (n.src === 'remndr') await remndrUnits(n);
    else if (n.src === 'pvt') await pvtUnits(n);
    else if (n.src === 'lh') await lhDetail(n);
    else if (n.src === 'soco') await socoUnits(n);
  });
  return all.filter((n) => !n.end || n.end >= today).sort((a, b) => (a.end ?? '9999').localeCompare(b.end ?? '9999'));
}
