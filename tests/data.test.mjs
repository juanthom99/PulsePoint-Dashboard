import test from 'node:test';
import assert from 'node:assert/strict';
import { parseCSV, formatValue } from '../lib/data.mjs';
import { metricColor, clampFloatingPanel } from '../lib/map-utils.mjs';
test('sample values stay labeled and leading zero FIPS is retained',()=>{
  const rows=parseCSV('county_fips,county_name,state_abbr,measure_code,year,value,is_sample\n06037,Los Angeles County,CA,OBESITY,2023,29.8,true');
  assert.equal(rows.length,1); assert.ok(rows.every(r=>r.is_sample));
  assert.equal(rows.find(r=>r.county_name==='Los Angeles County').county_fips,'06037');
});
test('CDC quoted names, missing values, intervals and estimate types survive normalization',()=>{
  const csv='LocationID,LocationName,StateAbbr,MeasureId,Year,Data_Value_Type,Data_Value,Low_Confidence_Limit,High_Confidence_Limit\n1001,"Autauga, County",AL,OBESITY,2023,Crude prevalence,,20,30\n1001,"Autauga, County",AL,OBESITY,2023,Age-adjusted prevalence,25,23,27';
  const rows=parseCSV(csv);assert.equal(rows.length,2);assert.equal(rows[0].county_fips,'01001');assert.equal(rows[0].value,null);assert.equal(rows[0].is_sample,false);assert.equal(rows[1].low,23);assert.equal(formatValue(null),'Unavailable');assert.equal(formatValue(0),'0.0%');
});
test('GIS-friendly wide format (CountyFIPS + <MEASURE>_CrudePrev columns) is auto-detected',()=>{
  const csv='StateAbbr,StateDesc,CountyName,CountyFIPS,OBESITY_CrudePrev,OBESITY_Crude95CI,DIABETES_CrudePrev,DIABETES_Crude95CI\nSC,South Carolina,Charleston,45019,31.4,"( 29.5,  33.3)",10.8,"( 9.8,  11.8)"';
  const rows=parseCSV(csv);
  assert.equal(rows.length,2);
  const obesity=rows.find(r=>r.measure_code==='OBESITY');
  assert.equal(obesity.county_fips,'45019');
  assert.equal(obesity.state_abbr,'SC');
  assert.equal(obesity.value,31.4);
  assert.equal(obesity.low,29.5);
  assert.equal(obesity.high,33.3);
  assert.equal(obesity.is_sample,false);
});
test('duplicate and incompatible files fail clearly',()=>{
  const header='county_fips,county_name,state_abbr,measure_code,year,value\n';
  const row='01001,Autauga,AL,OBESITY,2023,25';
  assert.throws(()=>parseCSV(header+row+'\n'+row),/Duplicate/);
  assert.throws(()=>parseCSV('hello,world\none,two'),/No supported/);
});
test('map colors handle missing, flat and clamped values',()=>{
  assert.equal(metricColor(null,10,20),'#101c31');
  assert.equal(metricColor(15,10,20),'hsl(219.0 82% 58.0%)');
  assert.equal(metricColor(50,10,20),metricColor(20,10,20));
  assert.equal(metricColor(10,10,10),'hsl(219.0 82% 58.0%)');
});
test('floating panels stay on screen and move below the pointer near the top',()=>{
  assert.deepEqual(clampFloatingPanel(10,10,1200,800,330,350),{left:16,top:34});
  assert.deepEqual(clampFloatingPanel(1190,790,1200,800,330,350),{left:854,top:416});
});
