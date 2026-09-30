import fs from 'node:fs';
const make=(id,name,stops,start,end,mins,days='weekday',extra={})=>({id,name,stops:stops.split(','),start,end,mins,days,source:`https://transport.cuhk.edu.hk/route/${id.toLowerCase()}/`,...extra});
const night='1,22,2,4,na-circle,7,wys-up,shaw-up,55,56,18,20,21,shaw-down,wys-down,8,7,10,51,22,1';
const routes=[
 make('1','本部线','1,2,4,10,51,1','07:40','18:55',[10,25,40,55]),
 make('2','新联线','1,2,4,5,6,8,7,10,51,52','07:45','18:45',[15,45], 'weekday',{conditional:{'4':'minute45'}}),
 make('2S','新联线（经研究生宿舍）','1,22,2,4,5,6,8,7,10,51,22,52','08:00','18:30',[0,30]),
 make('3','逸夫线','53,2,24,5,wys-up,shaw-up,56,18,20,21,shaw-down,wys-down,10,51,52','09:00','18:40',[0,20,40]),
 make('4','环回线','1,62,64,55,56,18,20,21,shaw-down,wys-down,8,7,10,51,53','07:30','18:50',[10,30,50]),
 make('8','西部线','53,62,64,55,56,20,21,shaw-down,wys-down,10,24,na-circle,7,wys-up,shaw-up,area-down,66,63,1','07:35','18:35',[15,35,55], 'weekday',{nonTeachingEnd:['52','23']}),
 make('N','晚间线',night,'19:00','23:30',[0,15,30,45],'weekday',{conditional:{'22':'minute00'}}),
 make('H','假日线',night,'08:20','23:20',[0,20,40],'holiday',{conditional:{'22':'minute00','55':'minute00'}}),
 make('5','转堂上行','23,2,4,5,6,8,wys-up,shaw-up,56','09:18','17:26',[18,22,26],'teaching',{saturdayEnd:'13:26'}),
 make('6A','转堂下行 · 敬文','56,20,21,wys-down,8,7,10,51,52,23','09:10','17:10',[10],'teaching',{saturdayEnd:'13:10'}),
 make('6B','转堂下行 · 新联','8,7,10,51,52,23','12:20','17:20',[20],'teaching',{noSaturday:true}),
 make('7','转堂下行 · 逸夫','shaw-down,wys-down,8,7,10,51,52,23','08:18','17:18',[0,18],'teaching',{saturdayEnd:'13:18'})
];
const data={effectiveFrom:'2026-09-01',retrievedAt:'2026-10-01',validThrough:'2027-08-31',routes,alerts:[{title:'环回东站上行临时迁站',date:'2026-09-28',stops:['62'],url:'https://transport.cuhk.edu.hk/newsdetails/bus-stop-temporary-relocation-campus-circuit-east-upward/'},{title:'环回东站下行临时迁站',date:'2026-09-19',stops:['63'],url:'https://transport.cuhk.edu.hk/'}],holidays:JSON.parse(fs.readFileSync('data/raw/food-holidays.json')),holidayYears:[2026],teachingTerms:[['2026-09-07','2026-12-05'],['2027-01-11','2027-04-24']],readingWeeks:[['2027-03-08','2027-03-13']],calendarSource:'https://rgsntl.rgs.cuhk.edu.hk/aqs_prd_applx/public/handbook/view_document.aspx?id=1510&lang=zh&seq=1',holidaySource:'https://www.gov.hk/en/about/abouthk/holiday/index.htm',note:'发车时刻来自官方 2026-09-01 时刻表；中途站到站时刻和行驶时间为模型估算，非 GPS 实时数据。'};
fs.writeFileSync('public/data/transit.json',JSON.stringify(data));
console.log('12 routes compiled from visually checked 2026 timetables');
