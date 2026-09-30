import {Converter} from 'opencc-js/t2cn';
const simplify=Converter({from:'hk',to:'cn'});
export const normal=s=>simplify(s||'').toLowerCase().replace(/[\s\-_.·()（）]/g,'');
export function searchPlaces(places,q='',category='all',favorites=null){const tokens=(q||'').trim().split(/\s+/).map(normal).filter(Boolean);
 return places.filter(p=>(category==='all'||p.categories.includes(category))&&(!favorites||favorites.includes(p.id))).map(p=>{const name=normal(p.name),aliases=p.aliases.map(normal),hay=normal(p.search||[p.name,p.en,p.address,p.region,...p.aliases].join(' '));const match=tokens.every(t=>hay.includes(t));const score=tokens.reduce((n,t)=>n+(name===t?100:aliases.includes(t)?90:name.startsWith(t)?70:name.includes(t)?50:10),0);return {p,match,score};}).filter(x=>x.match).sort((a,b)=>b.score-a.score).map(x=>x.p);
}
