// Regenerates src/lib/us-map.json and public/data/us-cities.json.
// Run in a scratch folder with: npm i us-atlas all-the-cities topojson-client topojson-simplify d3-geo
// then: node gen-geo.mjs 1000
import fs from 'fs';
import { createRequire } from 'module';
const require = createRequire(import.meta.url);
const topo = require('topojson-client');
const simp = require('topojson-simplify');
const d3 = require('d3-geo');
const cities = require('all-the-cities');

// --- cities
const L48 = new Set("AL AZ AR CA CO CT DE FL GA ID IL IN IA KS KY LA ME MD MA MI MN MS MO MT NE NV NH NJ NM NY NC ND OH OK OR PA RI SC SD TN TX UT VT VA WA WV WI WY".split(" "));
const minPop = +process.argv[2] || 2000;
const seen = new Set();
const list = cities.filter(c => c.country==='US' && L48.has(c.adminCode) && c.population>=minPop && c.featureCode.startsWith('PPL'))
  .sort((a,b)=>b.population-a.population)
  .map(c=>`${c.name}, ${c.adminCode}`).filter(s=>!seen.has(s)&&seen.add(s));
fs.writeFileSync('cities.json', JSON.stringify(list));
console.log('cities', list.length, fs.statSync('cities.json').size);

// --- map
const us = JSON.parse(fs.readFileSync('node_modules/us-atlas/states-albers-10m.json'));
const pre = simp.presimplify(us);
const s = simp.simplify(pre, 0.6);
const fc = topo.feature(s, s.objects.states);
const path = d3.geoPath();
const fips = {"01":"AL","04":"AZ","05":"AR","06":"CA","08":"CO","09":"CT","10":"DE","12":"FL","13":"GA","16":"ID","17":"IL","18":"IN","19":"IA","20":"KS","21":"KY","22":"LA","23":"ME","24":"MD","25":"MA","26":"MI","27":"MN","28":"MS","29":"MO","30":"MT","31":"NE","32":"NV","33":"NH","34":"NJ","35":"NM","36":"NY","37":"NC","38":"ND","39":"OH","40":"OK","41":"OR","42":"PA","44":"RI","45":"SC","46":"SD","47":"TN","48":"TX","49":"UT","50":"VT","51":"VA","53":"WA","54":"WV","55":"WI","56":"WY"};
const round = d => d.replace(/\d+\.\d+/g, n => (+n).toFixed(1));
const out = fc.features.filter(f=>fips[f.id]).map(f=>({ abbr: fips[f.id], d: round(path(f)), c: path.centroid(f).map(v=>+v.toFixed(1)) }));
const proj = d3.geoAlbersUsa().scale(1300).translate([487.5,305]);
const jackson = proj([-90.1848, 32.2988]).map(v=>+v.toFixed(1));
fs.writeFileSync('us-map.json', JSON.stringify({ jackson, states: out }));
console.log('states', out.length, fs.statSync('us-map.json').size, jackson);
