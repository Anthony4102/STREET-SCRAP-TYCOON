/* ============================================================
   STREET SCRAP TYCOON — LIVING CITY BUILD
   Vanilla JS / no dependencies
   ============================================================ */

const GAME_CONFIG = { currencyCode:"PHP", locale:"en-PH", saveKey:"street-scrap-tycoon-save-v8" };
const DEV_PASSWORD_HASH = "c0b6d6b6b1e4f4e6d8f4f1f3d4a4d8a0e0d6e3a4c2b1f9e8d7c6b5a4f3e2d1c0"; // replaced at runtime by password check fallback

const DIFFICULTIES = {
  easy:{name:"Easy",description:"More resources, forgiving fatigue and recovery.",startingCash:120,startingFood:5,startingHealth:100,startingEnergy:100,healthDrain:1,energyRecovery:8,restEnergy:45,restHealth:8,workMultiplier:1.2,marketVolatility:.07,travelMultiplier:.75},
  normal:{name:"Normal",description:"The intended survival-economy experience.",startingCash:50,startingFood:3,startingHealth:100,startingEnergy:100,healthDrain:2,energyRecovery:5,restEnergy:35,restHealth:5,workMultiplier:1,marketVolatility:.12,travelMultiplier:1},
  hard:{name:"Hard",description:"Tighter economy, harsher fatigue and stronger pressure.",startingCash:25,startingFood:2,startingHealth:90,startingEnergy:90,healthDrain:3,energyRecovery:3,restEnergy:28,restHealth:3,workMultiplier:.85,marketVolatility:.18,travelMultiplier:1.25},
  brutal:{name:"Brutal",description:"Very little room for mistakes.",startingCash:10,startingFood:1,startingHealth:80,startingEnergy:80,healthDrain:4,energyRecovery:2,restEnergy:22,restHealth:2,workMultiplier:.7,marketVolatility:.25,travelMultiplier:1.5}
};

const DEV_CONFIG = {
  enabled:true,
  economy:{globalPriceMultiplier:1,sellPriceMultiplier:1,jobRewardMultiplier:1,scavengingValueMultiplier:1},
  survival:{healthDrainMultiplier:1,energyRecoveryMultiplier:1,restEnergyMultiplier:1,restHealthMultiplier:1},
  time:{enabled:true,travelHours:1,defaultSleepHours:8,minSleepHours:3,maxSleepHours:12},
  travel:{costMultiplier:1,energyMultiplier:1},
  market:{enabled:true,volatilityMultiplier:1,min:.65,max:1.5},
  fatigue:{workThreshold:25,criticalEnergy:10},
  events:{enabled:true,rareChance:.08,commonChance:.18}
};

const DEV_CONFIG_SAVE_KEY="street-scrap-tycoon-dev-config-v1";

const START_STORIES=[
 {title:"The Last Shift",body:"Your last steady job disappeared with almost no warning. With a backpack, a few pesos and nowhere permanent to go, you followed the flow of workers into San Isidro. Someone told you the city rewards people who notice what everyone else ignores.",goal:"Build a sustainable livelihood from scavenging, work, trading, contracts and eventually your own businesses."},
 {title:"A Debt and a Backpack",body:"A small debt became a deadline, the deadline became a lost room, and the only thing you kept was your battered backpack. You arrive in the city before sunrise with just enough cash to buy food and one more day.",goal:"Survive long enough to turn small trades into reliable cashflow, relationships and ownership."},
 {title:"Following the Fish Trucks",body:"You came into the city behind a convoy of fish trucks, hoping to find day work at the port. Instead, you discovered a whole economy moving while most of the city slept.",goal:"Learn the city's rhythms, exploit changing markets and build an operation that can work around the clock."},
 {title:"The Old Contact",body:"Someone from your old neighborhood gave you one name: a scrap buyer in San Isidro. They said the contact might help, but only if you prove you are useful. You have no guarantee the introduction will lead anywhere.",goal:"Raise specific relationships to unlock people, businesses and contracts, then use those opportunities to grow."},
 {title:"Starting From the Street",body:"There is no grand inheritance waiting for you. You simply woke up with a place to stand, a few coins and a city full of possibilities. Every district is open, but the people inside them do not owe you anything.",goal:"Create your own path from street-level survival to property, production, contracts and a functioning business network."},
 {title:"The Failed Delivery",body:"A delivery you were supposed to make never happened. You lost the job and the room that came with it. Rather than leave the city, you decide to make something from the materials and opportunities already moving through its streets.",goal:"Recover financially, learn the market, build reputation and decide what kind of operator you want to become."},
 {title:"A Chance Before Dawn",body:"At 4:00 AM the fishport is louder than the rest of the city. You followed the noise and found unloading crews, traders and buyers working before offices even opened.",goal:"Use time, location, fatigue and changing demand to discover profitable routines and build a long-term enterprise."},
 {title:"No Plan, Just One More Day",body:"You cannot remember the last time you had a stable plan. What you do have is one more day, a little food and a city that keeps changing. That is enough to start.",goal:"Stay alive, learn the systems, unlock opportunities and build enough wealth and infrastructure that survival is no longer the only objective."}
];

function pickStartStory(){return START_STORIES[Math.floor(Math.random()*START_STORIES.length)]}
function saveDevConfig(){try{localStorage.setItem(DEV_CONFIG_SAVE_KEY,JSON.stringify(DEV_CONFIG));toast("Developer configuration saved.")}catch(e){toast("Could not save developer configuration.")}}
function loadDevConfig(){try{const raw=localStorage.getItem(DEV_CONFIG_SAVE_KEY);if(!raw)return;const saved=JSON.parse(raw);for(const [k,v] of Object.entries(saved||{})){if(v&&typeof v==="object"&&!Array.isArray(v))DEV_CONFIG[k]=Object.assign({},DEV_CONFIG[k]||{},v);else if(k in DEV_CONFIG)DEV_CONFIG[k]=v}}catch(e){console.warn("Developer config load failed",e)}}

const DAY_NAMES=["Monday","Tuesday","Wednesday","Thursday","Friday","Saturday","Sunday"];
const PERIODS=["Deep Night","Dawn","Morning","Midday","Afternoon","Evening","Late Night"];

function difficultyData(){return DIFFICULTIES[state?.difficulty||"normal"]||DIFFICULTIES.normal}
function formatMoney(v){return new Intl.NumberFormat(GAME_CONFIG.locale,{style:"currency",currency:GAME_CONFIG.currencyCode,minimumFractionDigits:2,maximumFractionDigits:2}).format(v)}
function clamp(v,min,max){return Math.max(min,Math.min(max,v))}
function escapeHtml(v){return String(v).replace(/[&<>"']/g,c=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#039;"}[c]))}
function timeText(min){const h=Math.floor(min/60)%24,m=min%60,s=h>=12?"PM":"AM",hh=h%12||12;return `${hh}:${String(m).padStart(2,"0")} ${s}`}
function clockHour(){return Math.floor(state.timeMinutes/60)%24}
function timePeriod(min){const h=Math.floor(min/60)%24;if(h<5)return PERIODS[0];if(h<8)return PERIODS[1];if(h<12)return PERIODS[2];if(h<14)return PERIODS[3];if(h<18)return PERIODS[4];if(h<22)return PERIODS[5];return PERIODS[6]}
function currentDayName(){return DAY_NAMES[(state.day-1)%7]}
function calendarDate(){const start=new Date(`${state.startDate||"2026-09-24"}T00:00:00`);const d=new Date(start);d.setDate(d.getDate()+state.day-1);return d}
function dateText(){return calendarDate().toLocaleDateString("en-PH",{year:"numeric",month:"short",day:"numeric"})}
function dateKey(){const d=calendarDate();return `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,"0")}-${String(d.getDate()).padStart(2,"0")}`}
function isBirthday(){const start=new Date(`${state.startDate||"2026-09-24"}T00:00:00`),d=calendarDate();return state.day>1&&d.getMonth()===start.getMonth()&&d.getDate()===start.getDate()}
function toast(msg){const el=document.querySelector("#toast");if(!el){console.info(msg);return}el.textContent=msg;el.classList.add("show");clearTimeout(toast.timer);toast.timer=setTimeout(()=>el.classList.remove("show"),2400)}
function addLog(msg){const entry={day:state.day,date:dateKey(),time:timeText(state.timeMinutes),text:String(msg)};state.history.unshift(entry);state.history=state.history.slice(0,500);state.dailyLog.unshift(entry);state.dailyLog=state.dailyLog.slice(0,80);state.log=state.history.map(x=>`${x.date} • Day ${x.day} • ${x.time}: ${x.text}`).slice(0,500)}
function fail(msg){addLog(msg);toast(msg)}

const DISTRICTS=[
 {id:"san-isidro",name:"San Isidro",type:"Dense Urban Barangay",description:"Crowded homes, sari-sari stores, alleys and everyday street commerce.",travelCost:0,energyCost:0,unlock:null},
 {id:"bagong-palengke",name:"Bagong Palengke",type:"Public Market District",description:"Wholesale food, vendors, deliveries and market-side opportunities.",travelCost:3,energyCost:8,unlock:null},
 {id:"riverside-industrial",name:"Riverside Industrial",type:"Industrial & Warehouse Zone",description:"Warehouses, workshops, construction materials and scrap opportunities.",travelCost:5,energyCost:12},
 {id:"port-district",name:"Port District",type:"Harbor & Logistics Zone",description:"Cargo, fishing commerce, deliveries and logistics meet here.",travelCost:7,energyCost:15},
 {id:"mabuhay-business-center",name:"Mabuhay Business Center",type:"Commercial Business District",description:"Offices, established stores, services and higher-value opportunities.",travelCost:8,energyCost:15},
 {id:"fishport",name:"San Isidro Fishport",type:"Night Fish Landing Zone",description:"A cold, wet working port where fishing boats unload their catch before sunrise.",travelCost:9,energyCost:16},
 {id:"bagong-bayan",name:"Bagong Bayan",type:"Residential & Repair Quarter",description:"A dense residential district with repair shops, boarding houses and small owner-operated storefronts.",travelCost:6,energyCost:11},
 {id:"east-hills",name:"East Hills",type:"Upland Commercial Quarter",description:"A hilly edge of the city with hardware stores, salvage yards and quieter specialty trade.",travelCost:11,energyCost:18}
];

const NPCS=[
 {id:"mang-ben",name:"Mang Ben",role:"Scrap Buyer",district:"san-isidro",description:"Veteran scrap buyer who knows nearly every alley and junk pile.",startingRep:0,businessId:"ben-scrap-yard"},
 {id:"ate-liza",name:"Ate Liza",role:"Market Vendor",district:"bagong-palengke",description:"Food and household-goods vendor with a huge network of regular customers.",startingRep:0,businessId:"liza-market-stall"},
 {id:"jun",name:"Jun",role:"Warehouse Foreman",district:"riverside-industrial",description:"Straightforward foreman who hires reliable hands for sorting and loading.",startingRep:0,businessId:"riverside-warehouse"},
 {id:"kapitan-rico",name:"Kapitan Rico",role:"Port Contractor",district:"port-district",description:"Small logistics contractor who knows the port's unofficial worker network.",startingRep:0,businessId:"rico-logistics"},
 {id:"ms-valdez",name:"Ms. Valdez",role:"Corporate Procurement Manager",district:"mabuhay-business-center",description:"Procurement manager focused on reliability and consistent supply.",startingRep:0,businessId:"valdez-procurement"},
 {id:"nina",name:"Nina",role:"Fishport Auctioneer",district:"fishport",description:"A fast-talking auctioneer who can get you into the pre-dawn fish trade.",startingRep:0,businessId:"fishport-landing",unlock:{npc:"kapitan-rico",rep:12,label:"Kapitan Rico Rep 12"}},
 {id:"lando",name:"Lando",role:"Recycler Cooperative Lead",district:"riverside-industrial",description:"A sorter and materials grader who knows which buyers pay for quality.",startingRep:0,businessId:"recycler-coop",unlock:{npc:"jun",rep:25,label:"Jun Rep 25"}},
 {id:"tess",name:"Tess",role:"Wholesale Coordinator",district:"bagong-palengke",description:"Coordinates early deliveries and knows which traders are quietly expanding.",startingRep:0,businessId:"dawn-wholesale",unlock:{npc:"ate-liza",rep:25,label:"Ate Liza Rep 25"}}
];

const BUSINESSES=[
 {id:"ben-scrap-yard",name:"Ben's Scrap Yard",type:"Scrap Dealer",district:"san-isidro",owner:"mang-ben",description:"Buys metal, electronics and reusable material.",status:"Open",openHours:[[7,19]],buyMultiplier:.85,sellMultiplier:1.05,job:{title:"Sort Scrap",reward:25,energy:15,hours:3,openHours:[[7,18]]}},
 {id:"liza-market-stall",name:"Liza's Market Stall",type:"Food & General Goods",district:"bagong-palengke",owner:"ate-liza",description:"Food and everyday supplies in the heart of the market.",status:"Open",openHours:[[4,18]],buyMultiplier:1,sellMultiplier:.8,job:{title:"Unload Deliveries",reward:35,energy:20,hours:3,openHours:[[4,16]]}},
 {id:"riverside-warehouse",name:"Riverside Warehouse",type:"Industrial Warehouse",district:"riverside-industrial",owner:"jun",description:"Construction materials, industrial deliveries and salvage.",status:"Hiring",openHours:[[6,22]],buyMultiplier:.95,sellMultiplier:1.15,job:{title:"Warehouse Shift",reward:55,energy:30,hours:4,openHours:[[6,20]]}},
 {id:"rico-logistics",name:"Rico Logistics",type:"Port Contractor",district:"port-district",owner:"kapitan-rico",description:"Moves cargo between port, warehouses and city businesses.",status:"Hiring",openHours:[[0,24]],buyMultiplier:.9,sellMultiplier:1.2,job:{title:"Cargo Helper",reward:70,energy:35,hours:4,openHours:[[5,23]]}},
 {id:"valdez-procurement",name:"Valdez Procurement",type:"Corporate Buyer",district:"mabuhay-business-center",owner:"ms-valdez",description:"Corporate procurement office seeking reliable suppliers.",status:"Selective",openHours:[[8,18]],buyMultiplier:.8,sellMultiplier:1.35,job:{title:"Contract Delivery",reward:100,energy:40,hours:5,openHours:[[8,17]]}},
 {id:"fishport-landing",name:"Fishport Landing Shed",type:"Fresh Fish Trading",district:"fishport",owner:"nina",description:"Pre-dawn fish unloading, sorting and fast wholesale trades.",status:"Night Shift",openHours:[[1,5]],buyMultiplier:1.25,sellMultiplier:.75,job:{title:"Unload Night Catch",reward:95,energy:30,hours:2,openHours:[[1,5]]},unlock:{npc:"kapitan-rico",rep:18}},
 {id:"recycler-coop",name:"Recycler Cooperative",type:"Materials Cooperative",district:"riverside-industrial",owner:"lando",description:"A better-paying buyer unlocked through Jun's trust.",status:"Member Access",openHours:[[8,20]],buyMultiplier:.78,sellMultiplier:1.3,job:{title:"Grade Recyclables",reward:85,energy:25,hours:3,openHours:[[8,19]]},unlock:{npc:"jun",rep:20}},
 {id:"dawn-wholesale",name:"Dawn Wholesale Depot",type:"Early Market Buyer",district:"bagong-palengke",owner:"tess",description:"A loading bay that opens before the main market gets crowded.",status:"Dawn Access",openHours:[[2,7]],buyMultiplier:.9,sellMultiplier:1.12,job:{title:"Receive Dawn Shipment",reward:65,energy:22,hours:2,openHours:[[2,7]]},unlock:{npc:"ate-liza",rep:15}},
 {id:"corporate-surplus",name:"Corporate Surplus Office",type:"Industrial Surplus Buyer",district:"mabuhay-business-center",owner:"ms-valdez",description:"Buys sorted surplus in larger lots after you've proven dependable.",status:"Contract Only",openHours:[[9,17]],buyMultiplier:.72,sellMultiplier:1.5,job:{title:"Surplus Contract",reward:180,energy:45,hours:5,openHours:[[9,16]]},unlock:{npc:"ms-valdez",rep:25}},
 {id:"bayan-repair-row",name:"Bayan Repair Row",type:"Repair & Parts Shop",district:"bagong-bayan",owner:"jun",description:"Small repair counters selling tools, wire and workshop inputs.",status:"Open",openHours:[[8,20]],buyMultiplier:.92,sellMultiplier:1.08,job:{title:"Repair Bench Helper",reward:75,energy:25,hours:3,openHours:[[8,19]]}},
 {id:"east-hills-hardware",name:"East Hills Hardware",type:"Materials Supplier",district:"east-hills",owner:"ms-valdez",description:"Specialty supplier for production inputs and recovered building materials.",status:"Open",openHours:[[7,19]],buyMultiplier:.88,sellMultiplier:1.12,job:{title:"Stock Hardware",reward:90,energy:28,hours:3,openHours:[[7,18]]}}
];

const CONTRACTS=[
 {id:"scrap-bulk-01",name:"Neighborhood Scrap Run",client:"Mang Ben",description:"Deliver a clean mixed scrap batch to Ben's yard.",district:"san-isidro",reward:90,requirements:{scrapMetal:6},durationMinutes:360,unlock:{npc:"mang-ben",rep:8}},
 {id:"market-supply-01",name:"Market Restock",client:"Ate Liza",description:"Bring food and plastic supplies before the afternoon rush.",district:"bagong-palengke",reward:140,requirements:{food:3,plastic:4},durationMinutes:300,unlock:{npc:"ate-liza",rep:10}},
 {id:"warehouse-grade-01",name:"Sorted Industrial Lot",client:"Jun",description:"Deliver properly sorted metal and electronics to the warehouse.",district:"riverside-industrial",reward:240,requirements:{scrapMetal:10,electronics:3},durationMinutes:null,unlock:{npc:"jun",rep:15}},
 {id:"port-haul-01",name:"Night Cargo Assist",client:"Kapitan Rico",description:"Help move a late cargo load through the port network.",district:"port-district",reward:320,requirements:{tools:1,scrapMetal:5},durationMinutes:480,unlock:{npc:"kapitan-rico",rep:15}},
 {id:"fish-auction-01",name:"Pre-Dawn Fish Lot",client:"Nina",description:"Secure a fresh fish lot during the 1–5 AM landing window.",district:"fishport",reward:420,requirements:{freshFish:5},durationMinutes:240,unlock:{npc:"nina",rep:5}},
 {id:"corporate-surplus-01",name:"Surplus Supplier Contract",client:"Ms. Valdez",description:"Provide a mixed surplus order with reliable quality.",district:"mabuhay-business-center",reward:650,requirements:{scrapMetal:12,electronics:6,plastic:8},durationMinutes:null,unlock:{npc:"ms-valdez",rep:25}},
 {id:"recycler-quality-01",name:"Grade-A Materials",client:"Lando",description:"Deliver carefully graded recyclables for a premium buyer.",district:"riverside-industrial",reward:500,requirements:{scrapMetal:15,electronics:8},durationMinutes:720,unlock:{npc:"lando",rep:5}},
 {id:"dawn-network-01",name:"Quiet Wholesale Introduction",client:"Tess",description:"Complete a discreet dawn delivery for Tess's growing network.",district:"bagong-palengke",reward:380,requirements:{food:5,plastic:5},durationMinutes:300,unlock:{npc:"tess",rep:5}}
];

const GOODS={
 scrapMetal:{name:"Scrap Metal",description:"Mixed metal recovered from streets, workshops and abandoned material.",basePrice:8},
 electronics:{name:"Old Electronics",description:"Broken devices that may contain useful components.",basePrice:18},
 plastic:{name:"Plastic",description:"Sorted plastic collected from households and commercial areas.",basePrice:5},
 food:{name:"Food",description:"Basic meals and food supplies.",basePrice:12},
 panDeSal:{name:"Pandesal",description:"A simple bakery staple. Cheap, filling and easy to carry.",basePrice:6},
 bananaCue:{name:"Banana Cue",description:"A sweet street snack that gives a quick energy boost.",basePrice:10},
 firstAidKit:{name:"First-Aid Kit",description:"Basic emergency medical supplies for minor injuries.",basePrice:55},
 energyDrink:{name:"Calamansi Energy Drink",description:"A small local-style energy drink for a quick pick-me-up.",basePrice:24},
 bottledWater:{name:"Bottled Water",description:"Cold drinking water for hot days, long walks and humid street work.",basePrice:15},
 lugaw:{name:"Lugaw",description:"Warm rice porridge sold by neighborhood stalls; comforting, filling and easy to eat when worn out.",basePrice:20},
 tools:{name:"Tools",description:"Used tools useful for higher-value work.",basePrice:35},
 freshFish:{name:"Fresh Fish",description:"Fast-moving fish unloaded before sunrise. Spoils quickly if ignored.",basePrice:26},
copperWire:{name:"Copper Wire",description:"Stripped copper wire sorted from electronics and construction waste.",basePrice:24},
batteries:{name:"Used Batteries",description:"Recoverable batteries requiring careful handling and sorting.",basePrice:16},
glass:{name:"Glass",description:"Sorted bottles and broken glass recovered from shops and households.",basePrice:7},
textiles:{name:"Textiles",description:"Cloth, sacks and reusable fabric from shops and households.",basePrice:10},
medicine:{name:"Basic Medicine",description:"Common first-aid and pharmacy supplies traded through licensed channels.",basePrice:42},
lumber:{name:"Recovered Lumber",description:"Reusable boards and timber from construction and demolition sites.",basePrice:20},
cookingOil:{name:"Cooking Oil",description:"Bulk cooking oil used by food vendors and small kitchens.",basePrice:22},
sortedComponents:{name:"Sorted Components",description:"Higher-grade components prepared for workshops and specialist buyers.",basePrice:58},
processedFish:{name:"Processed Fish",description:"Cleaned and prepared fish with a longer selling window.",basePrice:48}
};

const PROGRESSION={
 tools:{name:"Tools",description:"Better tools improve scavenging yields.",levels:[{name:"Bare Hands",cost:0,scavengingBonus:0},{name:"Basic Tool Kit",cost:100,scavengingBonus:1},{name:"Professional Tools",cost:350,scavengingBonus:3},{name:"Industrial Kit",cost:900,scavengingBonus:6}]},
 storage:{name:"Storage",description:"Carry more materials.",levels:[{name:"Backpack",cost:0,capacity:10},{name:"Large Backpack",cost:150,capacity:25},{name:"Storage Cart",cost:450,capacity:50},{name:"Warehouse",cost:1500,capacity:150}]},
 vehicle:{name:"Transportation",description:"Reduce travel costs and improve job rewards.",levels:[{name:"On Foot",cost:0,travelReduction:0,jobBonus:0},{name:"Bicycle",cost:300,travelReduction:1,jobBonus:5},{name:"Motorcycle",cost:1200,travelReduction:3,jobBonus:15},{name:"Flatbed Truck",cost:5000,travelReduction:6,jobBonus:35}]},
 operation:{name:"Operation",description:"Grow from individual scavenger into a company.",levels:[{name:"Street Scavenger",cost:0},{name:"Independent Operator",cost:750},{name:"Small Business",cost:3000},{name:"Established Company",cost:10000}]}
};

const ESTABLISHMENTS=[
 {id:"street-processing-shed",name:"Street Processing Shed",district:"san-isidro",cost:1800,operationLevel:1,description:"A small rented workspace for turning low-value material into higher-grade goods.",recipe:{inputs:{scrapMetal:5,plastic:3},outputs:{sortedComponents:[2,5]},hours:3,energy:25}},
 {id:"fish-processing-kiosk",name:"Fish Processing Kiosk",district:"fishport",cost:3200,operationLevel:2,description:"A compact cold-work station that converts fresh catch into higher-value processed fish.",recipe:{inputs:{freshFish:5,cookingOil:1},outputs:{processedFish:[2,5]},hours:3,energy:30}},
 {id:"repair-workshop",name:"Repair Workshop",district:"riverside-industrial",cost:6500,operationLevel:2,description:"A proper workshop that turns electronics and copper into specialist components.",recipe:{inputs:{electronics:3,copperWire:3,batteries:1},outputs:{sortedComponents:[3,7]},hours:5,energy:40}},
 {id:"bayan-home-base",name:"Bayan Boarding Home",district:"bagong-bayan",cost:2400,operationLevel:1,category:"home",description:"A modest home base for sleeping, storing goods and planning the next day.",recipe:{inputs:{},outputs:{},hours:1,energy:0}},
 {id:"bayan-material-shop",name:"Bayan Materials Shop",district:"bagong-bayan",cost:4200,operationLevel:2,category:"shop",description:"Your own small shop for stocking production inputs and reselling workshop goods.",recipe:{inputs:{},outputs:{},hours:1,energy:0}},
 {id:"east-hills-supply-store",name:"East Hills Production Supply",district:"east-hills",cost:5200,operationLevel:2,category:"material-shop",description:"A specialist store focused on production inputs: wire, batteries, glass and lumber.",recipe:{inputs:{},outputs:{},hours:1,energy:0}},
 {id:"east-hills-salvage-yard",name:"East Hills Salvage Yard",district:"east-hills",cost:9000,operationLevel:3,category:"production",description:"A larger salvage operation that converts mixed recovery into valuable sorted components.",recipe:{inputs:{scrapMetal:8,electronics:4,glass:3},outputs:{sortedComponents:[5,12]},hours:6,energy:45}}
];

const RANDOM_CONTRACT_TEMPLATES=[
 {kind:"delivery",name:"Urgent Scrap Delivery",description:"A buyer needs a quick batch before their receiving window closes.",reward:[110,190],requirements:{scrapMetal:[5,9]},districts:["san-isidro","riverside-industrial"]},
 {kind:"delivery",name:"Market Supply Dash",description:"A vendor is short on stock and will pay for a fast delivery.",reward:[150,250],requirements:{plastic:[5,10],food:[2,4]},districts:["bagong-palengke"]},
 {kind:"transport",name:"Late Cargo Run",description:"A dispatcher needs a driver or hauler to move between districts before the deadline.",reward:[180,320],destination:"port-district",districts:["port-district","riverside-industrial"]},
 {kind:"transport",name:"Fishport Transfer",description:"Move a buyer's insulated load from the fishport to the market network.",reward:[220,380],destination:"bagong-palengke",districts:["fishport"]}
];

const AUCTION_HOUSES=[
 {id:"fishport-night-auction",name:"Fishport Night Auction",district:"fishport",openHours:[[1,5]],chance:.9,smuggle:false,description:"Fast pre-dawn lots of fish and fresh cargo."},
 {id:"port-cargo-auction",name:"Port Cargo Auction",district:"port-district",openHours:[[20,24],[0,2]],chance:.55,smuggle:true,description:"Late cargo lots, returned shipments and occasionally undeclared goods."},
 {id:"east-hills-salvage-auction",name:"East Hills Salvage Auction",district:"east-hills",openHours:[[18,22]],chance:.48,smuggle:false,description:"Evening auctions of tools, machinery, parts and recovered materials."},
 {id:"bagong-bayan-estate-auction",name:"Bayan Estate & Shop Auction",district:"bagong-bayan",openHours:[[10,14]],chance:.32,smuggle:false,description:"Occasional lots from closed shops, homes and liquidated stalls."}
];

const AUCTION_ITEMS=[
 {item:"electronics",qty:[2,5],base:[45,110]},
 {item:"copperWire",qty:[3,7],base:[70,150]},
 {item:"tools",qty:[1,2],base:[90,180]},
 {item:"freshFish",qty:[5,12],base:[80,190]},
 {item:"medicine",qty:[1,3],base:[90,180]},
 {item:"sortedComponents",qty:[2,5],base:[160,320]}
];

const EVENTS=[
 {id:"rain",name:"Sudden Downpour",icon:"☔",type:"weather",chance:.08,description:"Rain slows street work and makes travel messy.",effects:{energy:.05,time:30},districts:["san-isidro","bagong-palengke","riverside-industrial"]},
 {id:"truck-crash",name:"Delivery Truck Accident",icon:"⚠",type:"accident",chance:.035,description:"A minor truck accident blocks part of the road. You can help clear it for quick cash.",choice:{label:"Help clear the road",costEnergy:10,reward:55,hours:1}},
 {id:"lost-wallet",name:"Wallet on the Sidewalk",icon:"✦",type:"rare",chance:.018,description:"You spot a wallet with cash and an ID. What you do can affect your reputation.",choice:{label:"Turn it in",costEnergy:0,reward:30,hours:1,repNpc:"mang-ben",rep:2},alt:{label:"Keep the cash",reward:140,hours:0,scavengerRep:-2,consequence:"kept-wallet"}},
 {id:"scrap-cache",name:"Hidden Scrap Cache",icon:"◆",type:"opportunity",chance:.025,description:"Behind a collapsed fence you find a stash of valuable scrap.",choice:{label:"Recover the cache",costEnergy:8,rewardItems:{scrapMetal:4,electronics:2},hours:1}},
 {id:"fish-glut",name:"Night Fish Glut",icon:"🐟",type:"market",chance:.06,description:"A huge landing floods the fishport with fresh catch. Fish prices dip briefly.",districts:["fishport"],effects:{freshFish:.72}},
 {id:"power-outage",name:"Power Outage",icon:"⚡",type:"city",chance:.035,description:"A neighborhood outage closes some businesses temporarily.",effects:{hours:2}},
 {id:"street-festival",name:"Barangay Street Festival",icon:"🎉",type:"social",chance:.04,description:"A local celebration brings crowds, quick sales and extra foot traffic.",choice:{label:"Set up a small stall",costEnergy:8,reward:85,hours:2}},
 {id:"buyer-rush",name:"Unexpected Buyer Rush",icon:"📈",type:"market",chance:.045,description:"A buyer arrives looking for a material in bulk. Sell now for a temporary premium.",choice:{label:"Sell a quick batch",costEnergy:0,reward:95,hours:1}},
 {id:"cleanup-job",name:"Construction Cleanup",icon:"🧱",type:"opportunity",chance:.035,description:"A crew needs someone to clear reusable material before the truck arrives.",choice:{label:"Take the cleanup",costEnergy:15,reward:125,hours:2}},
 {id:"helping-hand",name:"Stranded Commuter",icon:"🤝",type:"social",chance:.028,description:"Someone needs help getting a heavy load to a nearby street.",choice:{label:"Help them",costEnergy:8,reward:45,hours:1,knowledge:1}},
 {id:"rare-copper",name:"Copper Cache",icon:"⚙",type:"rare",chance:.012,description:"You uncover a bundle of valuable copper wire tucked inside discarded equipment.",choice:{label:"Recover the cache",costEnergy:10,rewardItems:{copperWire:5,batteries:2},hours:1}},
 {id:"supplier-shortage",name:"Supplier Shortage",icon:"📦",type:"market",chance:.055,description:"A major supplier misses a delivery. One local material becomes scarce and buyers raise offers.",choice:{label:"Scout for substitute stock",costEnergy:8,reward:70,hours:1,knowledge:1}},
 {id:"npc-favor",name:"A Contact Needs a Favor",icon:"🤝",type:"social",chance:.045,description:"A nearby contact needs a quick hand. Helping can strengthen the relationship and reveal another opportunity.",choice:{label:"Help the contact",costEnergy:10,hours:1,repNpc:"ate-liza",rep:4,knowledge:2},alt:{label:"Decline politely",hours:0,repNpc:"ate-liza",rep:0}},
 {id:"warehouse-shortage",name:"Warehouse Shortage",icon:"🏭",type:"opportunity",chance:.04,description:"A warehouse is short on a production input and will pay a premium for a small emergency batch.",choice:{label:"Supply the shortage",costEnergy:5,reward:120,hours:1}},
 {id:"market-crash",name:"Sudden Oversupply",icon:"📉",type:"market",chance:.04,description:"A shipment arrives early and floods one district with goods. Prices fall sharply for a short time.",effects:{hours:1}},
 {id:"inspection",name:"Routine Inspection",icon:"🛂",type:"city",chance:.025,description:"Officials are checking cargo and unusual activity around the district.",choice:{label:"Cooperate",costEnergy:4,reward:20,hours:1,knowledge:1},alt:{label:"Avoid the area",hours:1,consequence:"dishonesty"}},
 {id:"lugaw-stall",name:"Lugaw Stall Before Dawn",icon:"🥣",type:"opportunity",chance:.04,description:"A lugaw cart is serving workers before sunrise. The vendor needs help moving rice and supplies.",districts:["fishport","bagong-palengke"],choice:{label:"Help the vendor",costEnergy:5,rewardItems:{lugaw:2,bottledWater:1},hours:1,knowledge:1}},
 {id:"heat-wave",name:"Brutal Midday Heat",icon:"☀️",type:"weather",chance:.05,description:"The heat becomes oppressive. Heavy work takes longer and drains more energy.",districts:["san-isidro","bagong-palengke","bagong-bayan","east-hills"],choice:{label:"Push through carefully",costEnergy:12,reward:35,hours:1},alt:{label:"Find shade and wait",costEnergy:2,hours:1}},
 {id:"rain-leak",name:"Leaking Shop Roof",icon:"🌧️",type:"weather",chance:.035,description:"Rainwater is pouring through a shop roof. The owner offers cash for a quick cleanup.",choice:{label:"Help with the cleanup",costEnergy:8,reward:65,hours:1,repNpc:"ate-liza",rep:2}},
 {id:"broken-tricycle",name:"Broken Tricycle",icon:"🛺",type:"opportunity",chance:.035,description:"A tricycle is blocking a narrow street and the driver needs a hand moving it aside.",choice:{label:"Help move it",costEnergy:6,reward:40,hours:1,knowledge:1},alt:{label:"Walk around",hours:0}},
 {id:"fish-crate-spill",name:"Fish Crate Spill",icon:"🐟",type:"accident",chance:.045,description:"A crate of fish tips over during unloading. You can help recover the catch before it is spoiled.",districts:["fishport","port-district"],choice:{label:"Help recover the fish",costEnergy:10,rewardItems:{freshFish:3},hours:1,repNpc:"nina",rep:3}},
 {id:"junk-shop-find",name:"Junk Shop Bargain",icon:"🔧",type:"opportunity",chance:.035,description:"A neighborhood junk shop has a box of mixed parts that the owner wants cleared out quickly.",choice:{label:"Buy the mystery box",costEnergy:2,reward:-25,hours:1}},
 {id:"brownout-shift",name:"Brownout Work Shift",icon:"🔦",type:"opportunity",chance:.035,description:"A brownout slows a workshop, but the foreman needs hands to sort by flashlight.",districts:["riverside-industrial","east-hills"],choice:{label:"Take the shift",costEnergy:14,reward:95,hours:2,repNpc:"jun",rep:3}},
 {id:"barangay-cleanup",name:"Barangay Cleanup Drive",icon:"🧹",type:"social",chance:.04,description:"Residents organize a cleanup and recyclable materials are being separated for collection.",choice:{label:"Join the cleanup",costEnergy:8,rewardItems:{plastic:3,glass:2},hours:2,knowledge:1},alt:{label:"Keep moving",hours:0}},
 {id:"phone-tip",name:"Phone Tip About a Buyer",icon:"📱",type:"social",chance:.03,description:"A contact sends a tip about a buyer looking for one specific material nearby.",choice:{label:"Follow the tip",costEnergy:2,reward:75,hours:1,knowledge:2},alt:{label:"Ignore the message",hours:0}},
 {id:"night-shift-bonus",name:"Night Shift Bonus",icon:"🌙",type:"opportunity",chance:.045,description:"A late-night establishment is short one worker and is offering a temporary premium.",districts:["fishport","port-district"],choice:{label:"Take the night work",costEnergy:15,reward:135,hours:2}},
 {id:"brownout-market",name:"Brownout Market Rush",icon:"🕯️",type:"market",chance:.03,description:"A brownout sends shoppers looking for batteries, water and ready-to-eat goods.",districts:["bagong-palengke","san-isidro"],choice:{label:"Sell emergency supplies",costEnergy:2,reward:110,hours:1}},
 {id:"roadside-toolbox",name:"Roadside Toolbox",icon:"🧰",type:"rare",chance:.015,description:"A mechanic's toolbox was left beside a repair stop. It may contain useful tools, but returning it could earn trust.",choice:{label:"Return the toolbox",costEnergy:2,reward:45,hours:1,repNpc:"jun",rep:4,knowledge:1},alt:{label:"Keep a useful tool",rewardItems:{tools:1},hours:0,scavengerRep:-1,consequence:"kept-tool"}},
 {id:"small-fire",name:"Small Electrical Fire",icon:"🔥",type:"accident",chance:.018,description:"A small electrical fire breaks out near a storefront. Helping from a safe distance can earn a reward, but smoke is exhausting.",choice:{label:"Help move people and goods",costEnergy:15,reward:100,hours:2,knowledge:2},alt:{label:"Stay clear",hours:0}},
 {id:"market-credit",name:"Vendor Offers Short Credit",icon:"🧾",type:"social",chance:.025,description:"A vendor who knows your reputation offers a small informal credit line for today's stock.",choice:{label:"Accept the trust",costEnergy:0,reward:60,hours:0,repNpc:"ate-liza",rep:2,consequence:"credit-taken"},alt:{label:"Decline",hours:0}},
 {id:"construction-bonus",name:"Demolition Crew Finds a Cache",icon:"🏗️",type:"opportunity",chance:.022,description:"A demolition crew uncovers reusable lumber and asks if you can help sort it before the truck arrives.",districts:["riverside-industrial","east-hills"],choice:{label:"Sort the salvage",costEnergy:12,rewardItems:{lumber:4,glass:2},hours:2,repNpc:"lando",rep:3}}
];

function randomStart(){
 const year=2024+Math.floor(Math.random()*5), month=Math.floor(Math.random()*12), days=new Date(year,month+1,0).getDate();
 const day=1+Math.floor(Math.random()*days), hour=Math.floor(Math.random()*24), minute=Math.floor(Math.random()*4)*15;
 const date=`${year}-${String(month+1).padStart(2,"0")}-${String(day).padStart(2,"0")}`;
 return {date,timeMinutes:hour*60+minute};
}

function randomMarketMultipliers(){
 const result={};
 for(const id of Object.keys(GOODS)){
   // Start each new sandbox with a genuinely mixed market rather than every good at 1.00.
   result[id]=Math.round((0.72+Math.random()*0.62)*100)/100;
 }
 return result;
}

function marketNeedsReroll(){
 const values=Object.values(state?.marketMultiplier||{});
 return !values.length || values.every(v=>Math.abs(Number(v)-1)<0.0001);
}

function freshState(difficulty="normal"){
 const d=DIFFICULTIES[difficulty]||DIFFICULTIES.normal;
 const npcRep={};NPCS.forEach(n=>npcRep[n.id]=n.startingRep);
 const start=randomStart(); return {turn:1,day:1,startDate:start.date,timeMinutes:start.timeMinutes,cash:d.startingCash,food:d.startingFood,health:d.startingHealth,energy:d.startingEnergy,hunger:Math.max(55,Math.min(100,70+d.startingFood*4)),currentDistrict:"san-isidro",difficulty,corporateSyndicateRep:0,scavengerRep:0,attireTier:"Rags",housingTier:"Streets",transportation:"Backpack",usePrivateVehicle:false,inventory:{scrapMetal:0,electronics:0,plastic:0,food:d.startingFood,panDeSal:0,bananaCue:0,firstAidKit:0,energyDrink:0,bottledWater:0,lugaw:0,tools:0,freshFish:0,copperWire:0,batteries:0,glass:0,textiles:0,medicine:0,lumber:0,cookingOil:0,sortedComponents:0,processedFish:0},progression:{tools:0,storage:0,vehicle:0,operation:0},npcRep,marketMultiplier:randomMarketMultipliers(),marketRandomizedVersion:2,startStory:pickStartStory(),startStorySeen:false,unlockedBusinesses:[],log:[],dailyLog:[],history:[],historyRange:7,birthdayYear:0,lifetimeCash:d.startingCash,activeEvent:null,knowledge:0,completedContracts:[],unlockedNPCs:[],unlockedContracts:[],acceptedContracts:{},rejectedContracts:{},randomContracts:[],marketViewDistrict:"san-isidro",ownedEstablishments:[],productionRuns:0,auctions:{},shopStocks:{},shopSales:{},npcActivity:{},dailyNews:[],districtAlerts:{},lastPeriod:timePeriod(start.timeMinutes),marketByDistrict:{},relationships:{},worldConsequences:{},establishmentState:{},auctionHistory:[],marketByDistrictVersion:1,localMarketSearch:"",localMarketSort:"default"};
}
let state=freshState();
// Startup data that depends on later declarations is initialized at the bottom of this file.
// Keeping it here would hit the temporal-dead-zone for SHOP_STOCKS before it is declared.


/* ============================================================
   WORLD SYSTEM SAFETY / ECONOMY FOUNDATION
   ============================================================ */
function ensureWorldSystems(){
  if(!state.marketByDistrict) state.marketByDistrict={};
  if(!state.relationships) state.relationships={};
  if(!state.worldConsequences) state.worldConsequences={};
  if(!state.establishmentState) state.establishmentState={};
  if(!state.auctionHistory) state.auctionHistory=[];
  if(!state.npcActivity) state.npcActivity={};
  if(!state.shopStocks) state.shopStocks={};
  if(!state.shopSales) state.shopSales={};
  if(!state.districtAlerts) state.districtAlerts={};
  if(!Number.isFinite(state.hunger)) state.hunger=Math.max(55,Math.min(100,70+(state.inventory?.food||0)*4));
  if(!state.auctions) state.auctions={};
  for(const d of DISTRICTS){
    if(!state.marketByDistrict[d.id]) state.marketByDistrict[d.id]={};
    for(const id of Object.keys(GOODS)){
      if(!Number.isFinite(state.marketByDistrict[d.id][id])){
        const base=Number(state.marketMultiplier?.[id]);
        state.marketByDistrict[d.id][id]=Number.isFinite(base)?base:Math.round((.72+Math.random()*.62)*100)/100;
      }
    }
  }
  for(const n of NPCS){
    if(!Number.isFinite(state.relationships[n.id])) state.relationships[n.id]=Number(state.npcRep?.[n.id]||0);
  }
}
function marketMultiplierFor(goodId,districtId){
  ensureWorldSystems();
  const d=state.marketByDistrict[districtId]||(state.marketByDistrict[districtId]={});
  if(!Number.isFinite(d[goodId])) d[goodId]=Number(state.marketMultiplier?.[goodId])||1;
  return clamp(Number(d[goodId]),.55,1.65);
}
function setMarketMultiplierFor(goodId,value,districtId=state.currentDistrict){
  ensureWorldSystems();
  if(!state.marketByDistrict[districtId]) state.marketByDistrict[districtId]={};
  state.marketByDistrict[districtId][goodId]=clamp(Number(value)||1,.55,1.65);
  if(districtId===state.currentDistrict) state.marketMultiplier[goodId]=state.marketByDistrict[districtId][goodId];
}
function simulateDistrictEconomy(){
  ensureWorldSystems();
  for(const d of DISTRICTS){
    for(const id of Object.keys(GOODS)){
      const current=marketMultiplierFor(id,d.id);
      const drift=(1-current)*.045;
      const noise=(Math.random()-.5)*.16;
      const timeBias=timePeriod(state.timeMinutes)==='Night' && id==='fishport' && id!=='food' ? 0 : 0;
      setMarketMultiplierFor(id,current+drift+noise+timeBias,d.id);
    }
  }
  for(const id of Object.keys(GOODS)) state.marketMultiplier[id]=marketMultiplierFor(id,state.currentDistrict);
}
function npcSchedule(id){
  const n=getNPC(id); if(!n)return null;
  const schedules={
    'mang-ben':[[7,18,'buying and sorting scrap']],
    'ate-liza':[[5,16,'working her market stall']],
    'jun':[[6,19,'running the warehouse']],
    'kapitan-rico':[[1,7,'working the port network'],[15,22,'handling logistics']],
    'ms-valdez':[[8,18,'handling procurement']],
    'nina':[[1,6,'working the fishport']],
    'lando':[[8,20,'running the recycling cooperative']],
    'tess':[[2,9,'receiving dawn shipments']]
  };
  const rows=schedules[id]||[[8,18,'working']];
  const h=clockHour(); return rows.find(([s,e])=>isHourInWindow(h,[[s,e]]))||null;
}
function changeRelationship(id,amount,reason='interaction'){
  if(!state.relationships)state.relationships={};
  state.relationships[id]=clamp((state.relationships[id]||0)+amount,-100,100);
  if(state.npcRep)state.npcRep[id]=state.relationships[id];
  if(amount) addLog(`${getNPC(id)?.name||'Contact'} relationship ${amount>0?'+':''}${amount} (${reason}).`);
}
function applyWorldConsequence(key){
  if(!state.worldConsequences)state.worldConsequences={};
  state.worldConsequences[key]=(state.worldConsequences[key]||0)+1;
  const effects={
    dishonesty:-2,
    'failed-production':-1,
    'missed-contract':-2,
    'auction-interest':1
  };
  if(key==='dishonesty')state.scavengerRep=clamp(state.scavengerRep+(effects[key]||-2),-100,100);
  if(key==='failed-production')state.knowledge+=1;
  if(key==='auction-interest')state.worldConsequences.auctionInterest=(state.worldConsequences.auctionInterest||0)+1;
}
function generateRandomContracts(){
  state.randomContracts=state.randomContracts||[];
  const now=totalMinutes();
  state.randomContracts=state.randomContracts.filter(c=>!c.expiresAt||c.expiresAt>now);
  if(state.randomContracts.length>=2)return;
  if(Math.random()>.45)return;
  const district=state.currentDistrict;
  const options=[
    {name:'Quick Delivery Run',client:'Local Buyer',description:'Move a small batch before the current market window closes.',district,reward:80+Math.floor(Math.random()*120),requirements:{plastic:2,scrapMetal:2},durationMinutes:240},
    {name:'Transport Assist',client:'Independent Trader',description:'Help move supplies across the district.',district,reward:120+Math.floor(Math.random()*160),requirements:{tools:1},durationMinutes:360}
  ];
  const c=options[Math.floor(Math.random()*options.length)]; c.id=`random-${Date.now()}-${Math.floor(Math.random()*9999)}`;c.expiresAt=now+c.durationMinutes;state.randomContracts.push(c);addLog(`NEW DISPATCH: ${c.name} is available in ${getDistrictName(district)}.`);
}
function ownEstablishment(id){return (state.ownedEstablishments||[]).includes(id)}
function auctionIsOpen(h){return isHourInWindow(clockHour(),h.openHours||[[0,24]])}
function ensureAuction(houseId){
  state.auctions=state.auctions||{};
  const h=AUCTION_HOUSES.find(x=>x.id===houseId); if(!h)return null;
  const key=`${state.day}:${houseId}`;
  if(!state.auctions[key]){
    const lots=h.lots||['Mixed materials lot'];
    state.auctions[key]={available:Math.random()<.7,currentBid:Math.round((h.minBid||100)*(0.8+Math.random()*.7)),playerBid:0,highBidder:false,finalized:false,lot:lots[Math.floor(Math.random()*lots.length)]};
  }
  return state.auctions[key];
}

function getDistrict(){return DISTRICTS.find(d=>d.id===state.currentDistrict)}
function getBusiness(id){return BUSINESSES.find(b=>b.id===id)}
function getNPC(id){return NPCS.find(n=>n.id===id)}
function getLevel(type){return state.progression[type]||0}
function getCurrentUpgrade(type){return PROGRESSION[type].levels[getLevel(type)]}
function getNextUpgrade(type){return PROGRESSION[type].levels[getLevel(type)+1]||null}
function storageCapacity(){return getCurrentUpgrade("storage").capacity}
const ESSENTIAL_ITEM_IDS=new Set(["food","panDeSal","bananaCue","firstAidKit","energyDrink","bottledWater","lugaw"]);
function isEssentialItem(id){return ESSENTIAL_ITEM_IDS.has(id)}
function materialCount(){return Object.keys(GOODS).reduce((sum,id)=>sum+(isEssentialItem(id)?0:(state.inventory[id]||0)),0)}
function toolBonus(){return getCurrentUpgrade("tools").scavengingBonus}
function vehicleData(){return getCurrentUpgrade("vehicle")}
function isHourInWindow(hour,windows){return (windows||[[0,24]]).some(([s,e])=>e===24?hour>=s:(s<e?hour>=s&&hour<e:hour>=s||hour<e))}
function isBusinessOpen(b){return isHourInWindow(clockHour(),b.openHours)}
function isJobOpen(j){return isHourInWindow(clockHour(),j.openHours)}
function unlockMet(rule){if(!rule)return true;return (state.npcRep[rule.npc]||0)>=rule.rep}
function npcUnlocked(n){return !n.unlock||unlockMet(n.unlock)||state.unlockedNPCs.includes(n.id)}
function businessUnlocked(b){return !b.unlock||unlockMet(b.unlock)||state.unlockedBusinesses.includes(b.id)}
function contractUnlocked(c){return !c.unlock||unlockMet(c.unlock)||state.unlockedContracts.includes(c.id)}
function districtUnlocked(d){return !d.unlock||unlockMet(d.unlock)}
function nextOpenText(b){if(isBusinessOpen(b))return "Open now";const h=clockHour();for(const [s] of (b.openHours||[])){if(s>h)return `Opens at ${timeText(s*60)}`}return `Opens at ${timeText((b.openHours?.[0]?.[0]||0)*60)}`}
function getCurrentBusinesses(){return BUSINESSES.filter(b=>b.district===state.currentDistrict&&businessUnlocked(b))}
function availableDistricts(){return DISTRICTS.filter(districtUnlocked)}
function minutesLeft(){return 1440-state.timeMinutes}
function hasTime(min,label){if(!DEV_CONFIG.time.enabled)return true;if(min>minutesLeft())return fail(`Not enough time for ${label}. It is ${timeText(state.timeMinutes)}.`),false;return true}
const SHOP_STOCKS={
 "bayan-material-shop":{scrapMetal:[3,10],plastic:[4,12],copperWire:[1,5],batteries:[1,4],glass:[2,7],lumber:[2,6],tools:[0,2]},
 "east-hills-supply-store":{copperWire:[2,8],batteries:[2,7],glass:[3,9],lumber:[3,10],tools:[1,3],electronics:[1,4]},
 "liza-market-stall":{food:[3,14],panDeSal:[3,12],bananaCue:[1,8],lugaw:[1,6],bottledWater:[2,12],cookingOil:[1,6],medicine:[0,3],energyDrink:[1,5]},
 "ben-scrap-yard":{scrapMetal:[4,14],electronics:[1,7],plastic:[3,10]}
};
function rollRange(r){return Math.floor(r[0]+Math.random()*(r[1]-r[0]+1))}
function refreshShopStock(shopId){const table=SHOP_STOCKS[shopId];if(!table)return;const stock={};for(const [id,r] of Object.entries(table))stock[id]=rollRange(r);state.shopStocks[shopId]=stock;state.shopSales[shopId]={};}
function ensureShopStock(shopId){if(!state.shopStocks[shopId])refreshShopStock(shopId);return state.shopStocks[shopId]}
function refreshAllShops(){for(const id of Object.keys(SHOP_STOCKS))refreshShopStock(id);simulateOwnedShopSales()}
function simulateOwnedShopSales(){
 ensureWorldSystems();
 for(const e of ESTABLISHMENTS||[]){
  if(!state.ownedEstablishments?.includes(e.id)||!SHOP_STOCKS[e.id])continue;
  const stock=ensureShopStock(e.id);let earned=0;
  for(const [id,qty] of Object.entries(stock)){if(qty<=0)continue;const m=marketMultiplierFor(id,e.district);const chance=clamp(.12+(1-m)*.16+Math.random()*.16,.04,.45);if(Math.random()<chance){const sold=Math.min(qty,1+Math.floor(Math.random()*2));stock[id]-=sold;const unit=GOODS[id].basePrice*m*.95;earned+=unit*sold;state.shopSales[e.id]=state.shopSales[e.id]||{};state.shopSales[e.id][id]=(state.shopSales[e.id][id]||0)+sold;}}
  if(earned>0){state.cash+=Math.round(earned*100)/100;state.lifetimeCash+=earned;addLog(`🏪 ${e.name} made ${formatMoney(earned)} in customer sales during ${timePeriod(state.timeMinutes)}.`);}
 }
}
function updateNPCActivity(){ensureWorldSystems();for(const n of NPCS){const row=npcSchedule(n.id);const roll=Math.random();state.npcActivity[n.id]={available:!!row&&roll>.12,district:n.district,note:row?(roll>.82?"busy with a private errand":row[2]):"off duty",period:row?`${row[0]}:00–${row[1]}:00`:"off duty"};}}
const DAILY_NEWS=[
 "Morning traders report uneven demand for recovered materials across the city.",
 "A fish landing surge is expected before dawn; buyers may pay more for transport.",
 "Several small shops are quietly changing suppliers today.",
 "Construction crews are clearing a new site near the industrial quarter.",
 "Rumors spread of a private buyer looking for unusual materials.",
 "A neighborhood celebration is drawing extra foot traffic today.",
 "Port workers warn that some cargo lots may be delayed today.",
 "Local repair shops report a shortage of batteries and copper wire."
];
function publishDailyNews(){state.dailyNews=[];const count=1+Math.floor(Math.random()*3);const pool=[...DAILY_NEWS];for(let i=0;i<count&&pool.length;i++){const idx=Math.floor(Math.random()*pool.length);state.dailyNews.push(pool.splice(idx,1)[0]);}if(state.dailyNews.length){addLog(`📰 Daily News: ${state.dailyNews[0]}`);}}
function hungerStatus(){const h=Number(state.hunger||0);if(h<=15)return "Starving";if(h<=30)return "Very Hungry";if(h<=50)return "Hungry";if(h<=75)return "Okay";return "Full";}
function housingData(){return ({Streets:{sleepQuality:.55,healthRecovery:0,healthDrain:1.6},"Leased Warehouse":{sleepQuality:.8,healthRecovery:2,healthDrain:.7},"High-Rise Penthouse":{sleepQuality:1.15,healthRecovery:5,healthDrain:.15}})[state.housingTier]||{sleepQuality:.55,healthRecovery:0,healthDrain:1.6};}
function applyLivingPressure(minutes){if(minutes<=0)return;const hours=minutes/60;state.hunger=clamp((state.hunger??70)-hours*5,0,100);const burdenRatio=storageCapacity()>0?materialCount()/storageCapacity():0;if(burdenRatio>.8){const extra=Math.ceil(hours*(burdenRatio>.95?1.2:.45));state.energy=Math.max(0,state.energy-extra);if(Math.random()<Math.min(.35,hours*.08))addLog("Your overloaded bag slows you down and leaves you more worn out.");}let healthLoss=0;if(state.hunger<=15)healthLoss+=hours*1.2;else if(state.hunger<=30)healthLoss+=hours*.45;if(state.housingTier==="Streets")healthLoss+=hours*.18;state.health=clamp(state.health-healthLoss,0,100);}
function maybeLivingScenario(source){const r=Math.random();if(r<.035){const damage=3+Math.floor(Math.random()*9);state.health=clamp(state.health-damage,0,100);state.activeEvent="Minor accident";addLog(`⚠️ Minor accident while ${source}. You lose ${damage} health. A First-Aid Kit can help.`);return;}if(r<.065){state.activeEvent="Sudden weather";const loss=2+Math.floor(Math.random()*5);state.energy=Math.max(0,state.energy-loss);addLog(`🌧️ Sudden weather makes ${source} harder. You lose ${loss} energy.`);}}
function useConsumable(id){const qty=state.inventory[id]||0;if(qty<=0)return fail(`You do not have any ${GOODS[id]?.name||"of that item"}.`);if(id==="firstAidKit"){state.inventory[id]--;state.health=clamp(state.health+28,0,100);addLog("You use a First-Aid Kit and recover 28 health.");}else if(id==="energyDrink"){state.inventory[id]--;state.energy=clamp(state.energy+24,0,100);state.hunger=clamp(state.hunger+4,0,100);addLog("You drink a Calamansi Energy Drink and recover 24 energy.");}else if(id==="bottledWater"){state.inventory[id]--;state.energy=clamp(state.energy+6,0,100);state.hunger=clamp(state.hunger+5,0,100);addLog("You drink Bottled Water. The heat eases and you recover a little energy.");}else if(id==="bananaCue"){state.inventory[id]--;state.hunger=clamp(state.hunger+22,0,100);state.energy=clamp(state.energy+8,0,100);addLog("You eat a Banana Cue. Hunger improves and you get a small energy boost.");}else if(id==="panDeSal"){state.inventory[id]--;state.hunger=clamp(state.hunger+18,0,100);state.energy=clamp(state.energy+5,0,100);addLog("You eat Pandesal. Hunger improves and you regain a little energy.");}else if(id==="lugaw"){state.inventory[id]--;state.hunger=clamp(state.hunger+28,0,100);state.energy=clamp(state.energy+10,0,100);state.health=clamp(state.health+5,0,100);addLog("You eat a warm bowl of Lugaw. Hunger improves, you regain some energy and feel a little better.");}else if(id==="food"){state.inventory[id]--;state.food=state.inventory.food;state.hunger=clamp(state.hunger+32,0,100);state.energy=clamp(state.energy+8,0,100);state.health=clamp(state.health+12,0,100);addLog("You eat a proper meal. Hunger improves, health recovers and energy rises.");}}
function checkPeriodChange(){const p=timePeriod(state.timeMinutes);if(p!==state.lastPeriod){state.lastPeriod=p;updateMarket();refreshAllShops();updateNPCActivity();generateRandomContracts();addLog(`The city shifts into ${p}. Shops restock, customers change, local dispatches refresh and market prices move with the time.`);}}

function advanceTime(min){if(!DEV_CONFIG.time.enabled)return;if(min<=0)return;state.timeMinutes+=min;applyLivingPressure(min);maybeLivingScenario("your routine");checkPeriodChange();while(state.timeMinutes>=1440){state.timeMinutes-=1440;state.day++;onNewDay()}cleanupDistrictAlerts()}
function spendTime(min,label){if(!hasTime(min,label))return false;advanceTime(min);return true}
function onNewDay(){
 state.dailyLog=[];
 state.hunger=clamp((state.hunger??70)-8,0,100);
 updateMarket(); updateNPCs(); refreshAllShops(); updateNPCActivity(); publishDailyNews(); state.activeEvent=null;
 state.rejectedContracts={};
 expireContracts(true);
 generateRandomContracts();
 addLog(`A new day begins on ${dateText()}. Fresh opportunities are circulating through the city.`);
 if(isBirthday()){const year=calendarDate().getFullYear();if(state.birthdayYear!==year){state.birthdayYear=year;state.cash+=100;state.health=Math.min(100,state.health+10);state.energy=Math.min(100,state.energy+10);state.knowledge+=3;addLog("🎂 Birthday: the city feels a little more generous today. You receive ₱100, +10 health, +10 energy and +3 knowledge.");state.activeEvent="Birthday";}}
}
function sleepFor(hours){hours=Math.max(DEV_CONFIG.time.minSleepHours,Math.min(DEV_CONFIG.time.maxSleepHours,Number(hours)||8));const start=timeText(state.timeMinutes);advanceTime(Math.round(hours*60));const d=difficultyData(),mult=Math.max(.5,hours/8);state.energy=Math.min(100,state.energy+Math.round(d.energyRecovery*mult*housingData().sleepQuality*DEV_CONFIG.survival.energyRecoveryMultiplier));
state.health=Math.min(100,state.health+Math.round((d.restHealth*mult+housingData().healthRecovery)*DEV_CONFIG.survival.restHealthMultiplier));
if(state.hunger<=20)state.health=Math.max(0,state.health-4);
addLog(`You sleep for ${hours} hours, from ${start} until ${timeText(state.timeMinutes)}${state.housingTier==="Streets"?" outside":""}.`);state.turn++;render()}
function sleepRecommendation(){if(state.energy<15)return 10;if(state.energy<30)return 8;if(state.energy<50)return 7;return 6}

const ACTIONS=[
 {id:"scavenge",title:"Scavenge",description:"Search the current district for useful materials.",run(){const cost=10;if(state.energy<cost)return fail("You are too exhausted to scavenge.");if(!hasTime(120,"scavenging"))return;const slots=storageCapacity()-materialCount();if(slots<=0)return fail("Your storage is full. Sell materials or upgrade storage.");state.energy-=cost;spendTime(120,"scavenging");const roll=Math.random();let item=roll<.34?"scrapMetal":roll<.54?"plastic":roll<.70?"electronics":roll<.80?"glass":roll<.88?"textiles":roll<.94?"batteries":"lumber";let amount=1+Math.floor(Math.random()*(2+toolBonus()));amount=Math.min(amount,slots);state.inventory[item]+=amount;state.scavengerRep=clamp(state.scavengerRep+1,-100,100);state.lifetimeCash+=0;addLog(`You recover ${amount} ${GOODS[item].name}.`);triggerRandomEvent("scavenge");}},
 {id:"work",title:"General Work",description:"Find a basic shift around the district.",run(){if(state.energy<25)return fail("You need at least 25 energy to work.");if(!hasTime(240,"a general shift"))return;state.energy-=25;spendTime(240,"general work");const reward=Math.round(30*difficultyData().workMultiplier*DEV_CONFIG.economy.jobRewardMultiplier);state.cash+=reward;state.lifetimeCash+=reward;addLog(`You work a general shift and earn ${formatMoney(reward)}.`);triggerRandomEvent("work");}},
 {id:"rest",title:"Rest / Nap",description:"Take a short 2-hour rest and recover.",run(){if(!hasTime(120,"a nap"))return;spendTime(120,"a nap");const d=difficultyData();state.energy=Math.min(100,state.energy+Math.round(d.restEnergy/2*DEV_CONFIG.survival.restEnergyMultiplier));state.health=Math.min(100,state.health+Math.round(d.restHealth/2*DEV_CONFIG.survival.restHealthMultiplier));addLog("You take a short rest.")}},
 {id:"eat",title:"Eat",description:"Eat a meal. Restore hunger, some health and a little energy.",run(){if(state.inventory.food<1)return fail("You have no food.");if(!hasTime(20,"a meal"))return;state.inventory.food--;state.food=state.inventory.food;state.hunger=clamp(state.hunger+32,0,100);state.health=Math.min(100,state.health+12);state.energy=Math.min(100,state.energy+8);spendTime(20,"a meal");addLog("You eat a proper meal. Hunger, health and energy improve.");}},
{id:"quickBite",title:"Quick Snack",description:"Use Pandesal or Banana Cue without taking much time.",run(){const id=state.inventory.panDeSal>0?"panDeSal":state.inventory.bananaCue>0?"bananaCue":null;if(!id)return fail("You have no quick snack. Buy Pandesal or Banana Cue.");if(!hasTime(10,"a quick snack"))return;useConsumable(id);spendTime(10,"a quick snack");}},
 {id:"sleep",title:"Sleep",description:"End your day and wake naturally after several hours.",run(){sleepFor(sleepRecommendation())}}
];

function travelToDistrict(id){if(id===state.currentDistrict)return;const d=DISTRICTS.find(x=>x.id===id);if(!d)return;const cost=Math.max(0,d.travelCost-vehicleData().travelReduction)*difficultyData().travelMultiplier*DEV_CONFIG.travel.costMultiplier;const energy=Math.ceil(d.energyCost*DEV_CONFIG.travel.energyMultiplier);if(state.cash<cost)return fail(`You need ${formatMoney(cost)} to travel there.`);if(state.energy<energy)return fail(`You need ${energy} energy to travel there.`);if(!hasTime(DEV_CONFIG.time.travelHours*60,"travel"))return;state.cash-=cost;state.energy-=energy;spendTime(DEV_CONFIG.time.travelHours*60,"travel");state.currentDistrict=id;addLog(`You travel to ${d.name}.`);triggerRandomEvent("travel");render()}

function talkToNPC(id){const n=getNPC(id);if(!n)return;if(!npcUnlocked(n)&&!state.unlockedNPCs.includes(n.id))return fail(`You do not know ${n.name} yet. ${n.unlock.label} is required.`);const b=getBusiness(n.businessId);if(state.npcActivity[id]&&!state.npcActivity[id].available)return fail(`${n.name} is ${state.npcActivity[id].note} right now.`);if(b&&!isBusinessOpen(b))return fail(`${n.name} is unavailable right now. ${nextOpenText(b)}.`);if(!hasTime(30,"talking"))return;spendTime(30,"talking");const rep=state.npcRep[id]||0;state.npcRep[id]=clamp(rep+1,-100,100);state.knowledge+=1;addLog(`${n.name} talks with you. Reputation with ${n.name}: ${state.npcRep[id]>=0?"+":""}${state.npcRep[id]}.`);checkUnlocks();render()}
function workForBusiness(id){const b=getBusiness(id);if(!b)return;if(!businessUnlocked(b))return fail(`This work area is locked. ${b.unlock.label} is required.`);if(!isBusinessOpen(b))return fail(`${b.name} is closed. ${nextOpenText(b)}.`);if(!isJobOpen(b.job))return fail(`${b.job.title} is not available right now.`);if(state.energy<b.job.energy)return fail(`You need ${b.job.energy} energy for ${b.job.title}.`);const minutes=b.job.hours*60;if(!hasTime(minutes,b.job.title))return;state.energy-=b.job.energy;spendTime(minutes,b.job.title);const reward=Math.round((b.job.reward+vehicleData().jobBonus)*difficultyData().workMultiplier*DEV_CONFIG.economy.jobRewardMultiplier);state.cash+=reward;state.lifetimeCash+=reward;const owner=getNPC(b.owner);if(owner)state.npcRep[owner.id]=clamp((state.npcRep[owner.id]||0)+3,-100,100);addLog(`You complete “${b.job.title}” at ${b.name} and earn ${formatMoney(reward)}.`);checkUnlocks();render()}
function buyGood(id,q=1){const g=GOODS[id];if(!g)return;const b=getCurrentBusinesses()[0];const stock=b&&SHOP_STOCKS[b.id]?ensureShopStock(b.id):null;if(stock&&(stock[id]||0)<q)return fail(`${b.name} is out of ${g.name} right now.`);let price=g.basePrice*(marketMultiplierFor(id,state.currentDistrict))*(b?b.buyMultiplier:1)*DEV_CONFIG.economy.globalPriceMultiplier;price=Math.round(price*100)/100;const total=price*q;if(state.cash<total)return fail(`You need ${formatMoney(total)} to buy ${q} ${g.name}.`);if(!isEssentialItem(id)&&materialCount()+q>storageCapacity())return fail("Your storage cannot hold that much material.");state.cash-=total;state.inventory[id]+=q;if(stock){stock[id]-=q;state.shopSales[b.id][id]=(state.shopSales[b.id][id]||0)+q;}state.food=state.inventory.food;addLog(`You buy ${q} ${g.name} for ${formatMoney(total)}.`);render()}
function renderContacts(){const c=document.querySelector("#contacts");if(!c)return;c.innerHTML=NPCS.map(n=>{const unlocked=npcUnlocked(n)||state.unlockedNPCs.includes(n.id);const rep=state.npcRep[n.id]||0;return `<div class="contact-card ${unlocked?"":"locked-card"}"><strong>${unlocked?n.name:"Unknown Contact"}</strong><span>${unlocked?n.role:"Locked contact"}</span><small>${unlocked?`Rep ${rep>=0?"+":""}${rep}`:`Requires ${n.unlock.label}`}</small></div>`}).join("")}

function renderContracts(){
 const c=document.querySelector("#contracts"); if(!c)return;
 c.innerHTML=CONTRACTS.map(x=>{
  const unlocked=contractUnlocked(x),done=state.completedContracts.includes(x.id),enough=unlocked&&Object.entries(x.requirements).every(([id,q])=>(state.inventory[id]||0)>=q);
  const needs=Object.entries(x.requirements).map(([id,q])=>`${GOODS[id].name} ×${q}`).join(" • ");
  let action="";
  if(unlocked) action=`<small>Needs: ${needs}</small><button class="business-button" data-contract="${x.id}" ${done||!enough?"disabled":""}>${done?"Completed":enough?"Complete Contract":"Missing Materials"}</button>`;
  else action=`<div class="unlock-line">🔒 ${x.unlock.label}</div>`;
  return `<article class="contract-card ${unlocked?"":"locked-card"}"><div class="contract-head"><div><strong>${unlocked?x.name:"Locked Contract"}</strong><span>${unlocked?x.client:"Unknown Client"}</span></div><b>${unlocked?formatMoney(x.reward):"???"}</b></div><p>${unlocked?x.description:`Requires ${x.unlock.label}`}</p>${action}</article>`;
 }).join("");
 document.querySelectorAll("[data-contract]").forEach(b=>b.onclick=()=>completeContract(b.dataset.contract));
}
function completeContract(id){const c=CONTRACTS.find(x=>x.id===id);if(!c||!contractUnlocked(c)||state.completedContracts.includes(id))return;if(!Object.entries(c.requirements).every(([k,q])=>(state.inventory[k]||0)>=q))return fail("You don't have the required materials.");Object.entries(c.requirements).forEach(([k,q])=>state.inventory[k]-=q);state.cash+=c.reward;state.lifetimeCash+=c.reward;state.completedContracts.push(id);state.knowledge+=2;addLog(`Contract completed: ${c.name}. You earn ${formatMoney(c.reward)} and gain 2 Knowledge.`);const npc=NPCS.find(n=>n.name===c.client);if(npc)state.npcRep[npc.id]=clamp((state.npcRep[npc.id]||0)+5,-100,100);checkUnlocks();render()}

function sellGood(id,q=1){const g=GOODS[id];if(!g||state.inventory[id]<q)return fail(`You don't have enough ${g?.name||"of that item"}.`);const b=getCurrentBusinesses()[0];let price=g.basePrice*(marketMultiplierFor(id,state.currentDistrict))*(b?b.sellMultiplier:1)*DEV_CONFIG.economy.globalPriceMultiplier*DEV_CONFIG.economy.sellPriceMultiplier;price=Math.round(price*100)/100;const total=price*q;state.inventory[id]-=q;state.cash+=total;state.lifetimeCash+=total;state.food=state.inventory.food;const owner=b&&getNPC(b.owner);if(owner)state.npcRep[owner.id]=clamp((state.npcRep[owner.id]||0)+2,-100,100);addLog(`You sell ${q} ${g.name} for ${formatMoney(total)}.`);checkUnlocks();render()}
function updateMarket(){simulateDistrictEconomy()}
function updateNPCs(){for(const n of NPCS){const rep=state.npcRep[n.id]||0;state.npcRep[n.id]=clamp(rep+(Math.random()<.55?1:-1),-100,100)}}

function checkUnlocks(){ensureWorldSystems();
 NPCS.forEach(n=>{if(!npcUnlocked(n)||state.unlockedNPCs.includes(n.id))return;state.unlockedNPCs.push(n.id);if(n.unlock){state.knowledge+=1;addLog(`NEW CONTACT: ${n.name} is now available. You learned a new piece of city knowledge.`);toast(`New contact: ${n.name}`)}});
 BUSINESSES.forEach(b=>{if(!b.unlock||!businessUnlocked(b)||state.unlockedBusinesses.includes(b.id))return;state.unlockedBusinesses.push(b.id);state.knowledge+=1;addLog(`NEW UNLOCK: ${b.name} is now available.`);toast(`Unlocked: ${b.name}`)});
 CONTRACTS.forEach(c=>{if(!c.unlock||!contractUnlocked(c)||state.unlockedContracts.includes(c.id))return;state.unlockedContracts.push(c.id);state.knowledge+=1;addLog(`NEW CONTRACT: ${c.name} is now known to you.`);toast(`New contract: ${c.name}`)});
}

function triggerRandomEvent(source){if(!DEV_CONFIG.events.enabled||state.activeEvent)return;let pool=EVENTS.filter(e=>(!e.districts||e.districts.includes(state.currentDistrict))&&(source!=="travel"||e.type!=="city"));const rare=pool.filter(e=>["rare","opportunity"].includes(e.type));const common=pool.filter(e=>!["rare","opportunity"].includes(e.type));let event=null;const knowledgeRareBonus=Math.min(.08,state.knowledge*.002);if(Math.random()<(DEV_CONFIG.events.rareChance+knowledgeRareBonus)&&rare.length)event=rare[Math.floor(Math.random()*rare.length)];else if(Math.random()<DEV_CONFIG.events.commonChance&&common.length)event=common[Math.floor(Math.random()*common.length)];if(!event)return;state.activeEvent=event.id;state.districtAlerts=state.districtAlerts||{};state.districtAlerts[state.currentDistrict]={label:event.name,expiresAt:totalMinutes()+240};applyEvent(event)}
function applyEvent(event){if(event.effects?.energy)state.energy=Math.max(0,state.energy-Math.ceil(state.energy*event.effects.energy));if(event.effects?.time)advanceTime(event.effects.time);if(event.effects?.hours)advanceTime(event.effects.hours*60);if(event.effects?.freshFish)setMarketMultiplierFor("freshFish",marketMultiplierFor("freshFish")*event.effects.freshFish,state.currentDistrict);addLog(`${event.icon} ${event.name}: ${event.description}`);if(event.choice)showEvent(event);else {toast(`${event.name}`);state.activeEvent=null;render()}}
function showEvent(event){document.querySelector("#eventTitle").textContent=`${event.icon} ${event.name}`;document.querySelector("#eventText").textContent=event.description;document.querySelector("#eventActions").innerHTML=`<button class="event-choice" id="eventPrimary">${event.choice.label}</button>${event.alt?`<button class="event-choice secondary" id="eventAlt">${event.alt.label}</button>`:""}<button class="event-choice ghost-event" id="eventIgnore">Ignore / Walk Away</button>`;document.querySelector("#eventModal").classList.add("show");document.querySelector("#eventPrimary").onclick=()=>resolveEvent(event,event.choice);if(event.alt)document.querySelector("#eventAlt").onclick=()=>resolveEvent(event,event.alt);document.querySelector("#eventIgnore").onclick=()=>{addLog(`You ignored ${event.name}.`);state.activeEvent=null;delete state.districtAlerts?.[state.currentDistrict];document.querySelector("#eventModal").classList.remove("show");render()}}
function resolveEvent(event,choice){if(choice.costEnergy&&(state.energy<choice.costEnergy))return fail(`You need ${choice.costEnergy} energy.`);if(choice.hours&&!hasTime(choice.hours*60,event.name))return;state.energy-=choice.costEnergy||0;if(choice.hours)spendTime(choice.hours*60,event.name);if(choice.reward){state.cash+=choice.reward;state.lifetimeCash+=choice.reward}if(choice.rewardItems)Object.entries(choice.rewardItems).forEach(([id,q])=>state.inventory[id]+=q);if(choice.repNpc){changeRelationship(choice.repNpc,choice.rep||0,choice.label)}if(choice.consequence)applyWorldConsequence(choice.consequence);if(choice.knowledge)state.knowledge+=choice.knowledge;if(choice.scavengerRep)state.scavengerRep=clamp(state.scavengerRep+choice.scavengerRep,-100,100);addLog(`You chose: ${choice.label}.`);state.activeEvent=null;delete state.districtAlerts?.[state.currentDistrict];document.querySelector("#eventModal").classList.remove("show");checkUnlocks();render()}

function endTurn(){sleepFor(sleepRecommendation())}
function upgrade(type){const data=PROGRESSION[type],next=getNextUpgrade(type);if(!next)return fail(`${data.name} is fully upgraded.`);if(state.cash<next.cost)return fail(`You need ${formatMoney(next.cost)} for ${next.name}.`);state.cash-=next.cost;state.progression[type]++;addLog(`${data.name} upgraded to ${next.name}.`);render()}

function renderStats(){const d=difficultyData();const stats=[["Cash",formatMoney(state.cash),`Lifetime ${formatMoney(state.lifetimeCash)}`],["Hunger",`${Math.round(state.hunger)}%`,hungerStatus()],["Health",`${state.health}%`,state.health<30?"Critical":"Stable"],["Energy",`${state.energy}%`,state.energy<25?"Tired":"Ready"],["Clock",timeText(state.timeMinutes),`${currentDayName()} • ${timePeriod(state.timeMinutes)}`],["Difficulty",d.name,`Day ${state.day} • Sleep ${sleepRecommendation()}h`]];document.querySelector("#stats").innerHTML=stats.map(s=>`<div class="stat"><div class="stat-label">${s[0]}</div><div class="stat-value">${s[1]}</div><div class="stat-sub">${s[2]}</div></div>`).join("")}
let actionFilter="all";
function renderActions(){const c=document.querySelector("#actions");if(!c)return;const groups=[["all","All"],["survive","Survive"],["earn","Earn"],["manage","Manage"]];const meta={scavenge:"earn",work:"earn",rest:"survive",eat:"survive",sleep:"survive"};c.innerHTML=`<div class="action-filters">${groups.map(([id,label])=>`<button class="action-filter ${actionFilter===id?"active":""}" data-action-filter="${id}">${label}</button>`).join("")}</div>`+ACTIONS.filter(a=>actionFilter==="all"||meta[a.id]===actionFilter).map(a=>`<button class="action ${a.id==="sleep"?"action-sleep":""}" data-action="${a.id}"><span class="action-icon">${a.id==="scavenge"?"⌕":a.id==="work"?"◈":a.id==="rest"?"◌":a.id==="eat"?"◆":"☾"}</span><span><strong>${a.title}</strong><span>${a.description}</span></span></button>`).join("");document.querySelectorAll("[data-action-filter]").forEach(b=>b.onclick=()=>{actionFilter=b.dataset.actionFilter;renderActions()});document.querySelectorAll("[data-action]").forEach(b=>b.onclick=()=>{ACTIONS.find(a=>a.id===b.dataset.action)?.run();render()})}
function renderUpgrades(){document.querySelector("#upgrades").innerHTML=Object.entries(PROGRESSION).map(([id,data])=>{const cur=getCurrentUpgrade(id),next=getNextUpgrade(id);return `<div class="upgrade-card"><div><strong>${data.name}</strong><small>${cur.name}</small></div>${next?`<button class="small-btn" data-upgrade="${id}">${formatMoney(next.cost)}</button>`:`<span class="badge">MAX</span>`}</div>`}).join("");document.querySelectorAll("[data-upgrade]").forEach(b=>b.onclick=()=>upgrade(b.dataset.upgrade))}
function renderSituation(){const d=getDistrict();document.querySelector("#turnLabel").textContent=`Turn ${state.turn} • Day ${state.day} • ${d.name} • ${timeText(state.timeMinutes)} • ${timePeriod(state.timeMinutes)}`;document.querySelector("#operationBadge").textContent=getCurrentUpgrade("operation").name;document.querySelector("#worldDescription").innerHTML=`<div class="location-banner"><div><span class="muted">CURRENT DISTRICT</span><strong>${escapeHtml(d.name)}</strong><span class="muted">${escapeHtml(d.type)}</span></div><p>${escapeHtml(d.description)}</p></div>`}
function districtSignals(districtId){
 const red=[];
 const orange=[];
 const now=totalMinutes();
 const alert=state.districtAlerts?.[districtId];
 if(alert&&(!alert.expiresAt||alert.expiresAt>now)) red.push(alert.label||"Something is happening");
 const accepted=[...CONTRACTS,...(state.randomContracts||[])].filter(c=>contractUnlocked(c)&&c.district===districtId&&(!c.expiresAt||c.expiresAt>now));
 if(accepted.length) orange.push(`${accepted.length} contract${accepted.length>1?"s":""}`);
 const dispatch=(state.randomContracts||[]).some(c=>c.district===districtId&&(!c.expiresAt||c.expiresAt>now));
 if(dispatch&&!orange.length) orange.push("Dispatch");
 const auction=AUCTION_HOUSES.some(h=>h.district===districtId&&ensureAuction(h.id).available);
 if(auction&&!orange.length) orange.push("Auction active");
 return {red,orange};
}
function cleanupDistrictAlerts(){
 const now=totalMinutes();
 if(!state.districtAlerts)state.districtAlerts={};
 for(const [id,a] of Object.entries(state.districtAlerts)){if(a.expiresAt&&a.expiresAt<=now)delete state.districtAlerts[id];}
}

function renderDistricts(){document.querySelector("#districts").innerHTML=DISTRICTS.map(d=>{const current=d.id===state.currentDistrict,unlocked=districtUnlocked(d),cost=Math.max(0,d.travelCost-vehicleData().travelReduction);const signals=districtSignals(d.id); return `<button class="district ${current?"current":""} ${!unlocked?"locked":""}" ${current||!unlocked?"disabled":""} data-district="${d.id}"><div class="district-top"><strong>${d.name}</strong><span class="district-signals">${signals.red.length?`<i class="district-alert-dot red" title="${escapeHtml(signals.red.join(" • "))}"></i>`:""}${signals.orange.length?`<i class="district-alert-dot orange" title="${escapeHtml(signals.orange.join(" • "))}"></i>`:""}<span class="badge">${current?"HERE":unlocked?"OPEN":"LOCKED"}</span></span></div><span class="district-type">${d.type}</span><span class="district-description">${unlocked?d.description:`Unlock: ${d.unlock.label}`}</span><span class="district-cost">${current?"Current location":unlocked?`Travel ${formatMoney(cost)} • ${d.energyCost} energy`:`Requires ${d.unlock.label}`}</span></button>`}).join("");document.querySelectorAll("[data-district]").forEach(b=>b.onclick=()=>travelToDistrict(b.dataset.district))}
function marketCondition(m){return m>=1.2?"High Demand":m<=.85?"Oversupplied":"Balanced"}
function marketSignal(m){if(m<=.92)return {label:"GOOD TIME TO BUY",cls:"buy",icon:"🟢"};if(m>=1.08)return {label:"GOOD TIME TO SELL",cls:"sell",icon:"🔴"};return {label:"WAIT / WATCH",cls:"watch",icon:"🟡"}}
function renderMarket(){const d=getDistrict(),b=getCurrentBusinesses()[0],stock=b&&SHOP_STOCKS[b.id]?ensureShopStock(b.id):null;document.querySelector("#market").innerHTML=`<div class="market-summary"><div><span class="muted">LOCAL MARKET</span><strong>${d.name}</strong></div><div><span class="muted">PRIMARY BUYER</span><strong>${b?b.name:"Independent Trading"}</strong></div></div><div class="market-grid">${Object.entries(GOODS).map(([id,g])=>{const m=marketMultiplierFor(id,state.currentDistrict),condition=marketCondition(m),buy=Math.round(g.basePrice*m*(b?b.buyMultiplier:1)*DEV_CONFIG.economy.globalPriceMultiplier*100)/100,sell=Math.round(g.basePrice*m*(b?b.sellMultiplier:1)*DEV_CONFIG.economy.globalPriceMultiplier*DEV_CONFIG.economy.sellPriceMultiplier*100)/100,owned=state.inventory[id],demand=clamp(Math.round((m-.65)/.85*100),0,100),supply=100-demand;return `<div class="good-card"><div class="good-header"><div><strong>${g.name}</strong><span>Market good</span></div><span class="owned">Owned: ${owned}${stock?` • Shop stock: ${stock[id]||0}`:""}</span></div><p>${g.description}</p><span class="market-condition">${condition} <em class="market-signal ${marketSignal(m).cls}">${marketSignal(m).icon} ${marketSignal(m).label}</em></span><div class="market-bars"><div class="market-bar-row"><span>Supply</span><div class="market-bar"><div class="market-bar-fill" style="width:${supply}%"></div></div><strong>${supply}</strong></div><div class="market-bar-row"><span>Demand</span><div class="market-bar"><div class="market-bar-fill" style="width:${demand}%"></div></div><strong>${demand}</strong></div></div><div class="price-row"><div><span class="price-label">BUY</span><strong>${formatMoney(buy)}</strong></div><div><span class="price-label">SELL</span><strong>${formatMoney(sell)}</strong></div></div><div class="market-buttons"><button class="market-button" data-buy="${id}">Buy 1</button><button class="market-button" data-sell="${id}" ${owned<=0?"disabled":""}>Sell 1</button></div></div>`}).join("")}</div>`;document.querySelectorAll("[data-buy]").forEach(x=>x.onclick=()=>buyGood(x.dataset.buy));document.querySelectorAll("[data-sell]").forEach(x=>x.onclick=()=>sellGood(x.dataset.sell))}
function throwItem(id){const g=GOODS[id];const owned=state.inventory[id]||0;if(!g||owned<=0)return;const q=Number(prompt(`How many ${g.name} do you want to throw away? (1-${owned})`,String(Math.min(1,owned))));if(!Number.isInteger(q)||q<1||q>owned)return toast("Invalid quantity.");devSnapshot();state.inventory[id]-=q;if(id==="food")state.food=state.inventory.food;addLog(`You throw away ${q} ${g.name}.`);render();}
function renderInventory(){
  const cap=document.querySelector("#backpackCapacity");
  if(cap)cap.textContent=`${materialCount()} / ${storageCapacity()} material slots • Essentials have separate carry capacity`;
  const c=document.querySelector("#inventory");
  if(!c)return;

  const materials=Object.entries(GOODS).filter(([id])=>!isEssentialItem(id)&&(state.inventory[id]||0)>0);
  const essentials=Object.entries(GOODS).filter(([id])=>isEssentialItem(id)&&(state.inventory[id]||0)>0);

  const card=([id,g])=>{
    const usable=isEssentialItem(id);
    return `<div class="inventory-item">
      <span><strong>${escapeHtml(g.name)}</strong><small>${escapeHtml(g.description)}</small></span>
      <div class="inventory-actions"><strong>${state.inventory[id]}</strong>${usable?`<button class="small-btn" data-use-item="${id}">Use</button>`:""}<button class="small-btn" data-throw-item="${id}">Throw</button></div>
    </div>`;
  };

  const materialCards=materials.length?materials.map(card).join(""):`<div class="empty-state">No carried materials yet. Scavenge, trade, or buy materials to fill this compartment.</div>`;
  const essentialCards=essentials.length?essentials.map(card).join(""):`<div class="empty-state">No food or personal supplies carried.</div>`;

  c.innerHTML=`
    <section class="inventory-compartment material-compartment">
      <div class="inventory-compartment-head">
        <div><strong>📦 Materials</strong><small>Scrap, components, tools and production goods. These use material slots and carry weight.</small></div>
        <span class="inventory-capacity">${materialCount()} / ${storageCapacity()}</span>
      </div>
      <div class="inventory-compartment-grid">${materialCards}</div>
    </section>
    <section class="inventory-compartment essentials-compartment">
      <div class="inventory-compartment-head">
        <div><strong>🍱 Essentials</strong><small>Food, snacks, first-aid and energy supplies. These have a separate compartment and do <b>not</b> use material slots.</small></div>
        <span class="inventory-capacity">NO MATERIAL WEIGHT</span>
      </div>
      <div class="inventory-compartment-grid">${essentialCards}</div>
    </section>`;

  c.querySelectorAll("[data-use-item]").forEach(b=>b.onclick=()=>{if(!hasTime(10,"using an item"))return;useConsumable(b.dataset.useItem);spendTime(10,"using an item");render()});
  c.querySelectorAll("[data-throw-item]").forEach(b=>b.onclick=()=>throwItem(b.dataset.throwItem));
}

function renderBusinesses(){const c=document.querySelector("#businesses"),near=BUSINESSES.filter(b=>b.district===state.currentDistrict);if(!near.length){c.innerHTML="<div class='empty-state'>No major businesses here.</div>";return}c.innerHTML=near.map(b=>{const o=getNPC(b.owner),rep=o?(state.npcRep[o.id]||0):0,unlocked=businessUnlocked(b),open=unlocked&&isBusinessOpen(b),jobOpen=unlocked&&isJobOpen(b.job);return `<article class="business-card ${unlocked?"":"locked-card"}"><div class="business-header"><div><div class="business-name">${b.name}</div><div class="business-type">${b.type}</div></div><span class="business-status ${open?"open":"closed"}">${unlocked?(open?"OPEN":"CLOSED"):"LOCKED"}</span></div><p class="business-description">${unlocked?b.description:`Unlock through reputation: ${b.unlock.label}`}</p>${o&&unlocked&&npcUnlocked(o)?`<div class="business-owner">Contact <strong>${o.name}</strong><span class="npc-tag">${o.role} • Rep ${rep>=0?"+":""}${rep}</span></div>`:""}${unlocked?`<div class="business-hours">${open?"Open now":nextOpenText(b)}</div><div class="business-actions">${o&&npcUnlocked(o)?`<button class="business-button" data-talk="${o.id}" ${open?"":"disabled"}>Talk</button>`:""}<button class="business-button" data-job="${b.id}" ${open&&jobOpen?"":"disabled"}>${b.job.title}</button></div>`:`<div class="unlock-line">🔒 ${b.unlock.label}</div>`}</article>`}).join("");document.querySelectorAll("[data-talk]").forEach(x=>x.onclick=()=>talkToNPC(x.dataset.talk));document.querySelectorAll("[data-job]").forEach(x=>x.onclick=()=>workForBusiness(x.dataset.job))}
function renderCharacter(){
 const d=getDistrict(), groups=[
  ["Character",[["Location",d.name],["Corporate Rep",state.corporateSyndicateRep],["Scavenger Rep",state.scavengerRep],["Knowledge",state.knowledge],["Operation Rank",`${getCurrentUpgrade("operation").name} • ${getLevel("operation")}/3`]]],
  ["Materials",Object.entries(GOODS).filter(([id])=>(state.inventory[id]||0)>0).map(([id,g])=>[g.name,state.inventory[id]])],
  ["Properties",[["Housing",state.housingTier],["Transport",getCurrentUpgrade("vehicle").name],["Owned Establishments",state.ownedEstablishments.length],["Private Vehicle",state.usePrivateVehicle?"Yes":"No"]]]
 ];
 document.querySelector("#character").innerHTML=groups.map(([title,vals])=>`<div class="character-group"><div class="group-title">${title}</div><div class="character-grid-inner">${vals.length?vals.map(([l,x])=>`<div class="kv"><div class="label">${escapeHtml(l)}</div><div class="value">${escapeHtml(String(x))}</div></div>`).join(""):"<div class='empty-state'>None</div>"}</div></div>`).join("");
}
function renderLog(){const top=document.querySelector("#logTop"),archive=document.querySelector("#log"),today=state.dailyLog||[];if(top)top.innerHTML=today.length?today.map(x=>`<div class="log-entry"><small>${escapeHtml(x.time)}</small>${escapeHtml(x.text)}</div>`).join(""):"<div class='empty-state'>Nothing has happened today yet.</div>";const range=Number(state.historyRange||7),minDay=range>=9999?0:Math.max(1,state.day-range+1),rows=(state.history||[]).filter(x=>x.day>=minDay);if(archive)archive.innerHTML=rows.length?rows.map(x=>`<div class="log-entry"><small>${escapeHtml(x.date)} • Day ${x.day} • ${escapeHtml(x.time)}</small>${escapeHtml(x.text)}</div>`).join(""):"<div class='empty-state'>No history in this range.</div>";const sel=document.querySelector("#historyRange");if(sel){sel.value=String(state.historyRange||7);sel.onchange=()=>{state.historyRange=Number(sel.value);renderLog()}}}
function renderUnlocks(){const c=document.querySelector("#unlocks");if(!c)return;const items=[...NPCS.filter(n=>n.unlock).map(n=>({name:`Contact: ${n.name}`,rule:n.unlock,ok:npcUnlocked(n)||state.unlockedNPCs.includes(n.id)})),...BUSINESSES.filter(b=>b.unlock).map(b=>({name:`Business: ${b.name}`,rule:b.unlock,ok:businessUnlocked(b)})),...CONTRACTS.filter(x=>x.unlock).map(x=>({name:`Contract: ${x.name}`,rule:x.unlock,ok:contractUnlocked(x)}))];const visible=items.filter(x=>x.ok);c.innerHTML=(visible.length?visible.map(x=>{const rep=state.npcRep[x.rule.npc]||0;return `<div class="unlock-item done"><span>✓</span><div><strong>${x.name}</strong><small>${x.rule.label} • Current ${rep}</small></div><span class="roadmap-state">UNLOCKED</span></div>`}).join(""):`<div class="roadmap-empty"><span class="fog-orb"></span><strong>Undiscovered opportunities</strong><small>Build relationships and knowledge to reveal what the city is hiding.</small></div>`)+`<div class="roadmap-count">${items.length-visible.length} discoveries remain hidden</div>`}
function renderEvent(){const e=state.activeEvent;document.querySelector("#eventBanner").innerHTML=e?`<div class="event-banner"><strong>Active Event</strong><span>${escapeHtml(e)}</span></div>`:""}
function renderEstablishmentGroups(){const c=document.querySelector("#establishments");if(!c)return;}
function render(){renderStats();renderActions();renderNews();renderUpgrades();renderSituation();renderDistricts();renderMarket();renderInventory();renderBusinesses();renderContacts();renderContracts();renderEstablishments();renderAuction();renderCharacter();renderLog();renderUnlocks();renderEvent();renderDevValues()}

function saveGame(){localStorage.setItem(GAME_CONFIG.saveKey,JSON.stringify(state));toast("Game saved in this browser.")}
function loadGame(){try{const raw=localStorage.getItem(GAME_CONFIG.saveKey);if(!raw)return false;const saved=JSON.parse(raw);const base=freshState(saved.difficulty||"normal");state=Object.assign(base,saved);state.startDate=saved.startDate||base.startDate;state.history=saved.history||[];state.dailyLog=saved.dailyLog||[];state.historyRange=saved.historyRange||7;state.birthdayYear=saved.birthdayYear||0;state.hunger=Number.isFinite(saved.hunger)?saved.hunger:70;state.inventory=Object.assign(base.inventory,saved.inventory||{});state.progression=Object.assign(base.progression,saved.progression||{});state.npcRep=Object.assign(base.npcRep,saved.npcRep||{});state.marketMultiplier=Object.assign(base.marketMultiplier,saved.marketMultiplier||{});state.marketByDistrict=Object.assign(base.marketByDistrict,saved.marketByDistrict||{});state.localMarketSearch=saved.localMarketSearch||"";state.localMarketSort=saved.localMarketSort||"default";state.relationships=Object.assign(base.relationships,saved.relationships||{});state.worldConsequences=Object.assign(base.worldConsequences,saved.worldConsequences||{});state.establishmentState=Object.assign(base.establishmentState,saved.establishmentState||{});state.auctionHistory=saved.auctionHistory||[];ensureWorldSystems();state.unlockedBusinesses=saved.unlockedBusinesses||[];state.completedContracts=saved.completedContracts||[];state.unlockedNPCs=saved.unlockedNPCs||[];state.unlockedContracts=saved.unlockedContracts||[];state.knowledge=Number.isFinite(saved.knowledge)?saved.knowledge:0;state.acceptedContracts=saved.acceptedContracts||{};state.rejectedContracts=saved.rejectedContracts||{};state.randomContracts=saved.randomContracts||[];state.marketViewDistrict=saved.marketViewDistrict||state.currentDistrict;state.startStory=saved.startStory||base.startStory;state.startStorySeen=saved.startStorySeen!==false;state.marketRandomizedVersion=Number(saved.marketRandomizedVersion)||0;state.ownedEstablishments=saved.ownedEstablishments||[];state.productionRuns=saved.productionRuns||0;state.auctions=saved.auctions||{};state.shopStocks=saved.shopStocks||{};state.shopSales=saved.shopSales||{};state.npcActivity=saved.npcActivity||{};state.dailyNews=saved.dailyNews||[];state.districtAlerts=saved.districtAlerts||{};state.lastPeriod=saved.lastPeriod||timePeriod(state.timeMinutes);if(!state.history.length&&Array.isArray(saved.log)){state.history=saved.log.map(x=>({day:state.day,date:state.startDate,time:"",text:String(x)}));state.dailyLog=state.history.slice(0,20)}for(const id of Object.keys(base.inventory))state.inventory[id]=Number.isFinite(state.inventory[id])?state.inventory[id]:0;checkUnlocks();generateRandomContracts();return true}catch(e){console.warn(e);return false}}

/* ============================================================
   CONTRACTS / PRODUCTION / MARKET BROWSER / AUCTIONS
   ============================================================ */
function totalMinutes(){return (state.day-1)*1440+state.timeMinutes}
function ruleAvailable(c){return c && contractUnlocked(c) && !state.completedContracts.includes(c.id) && !(state.rejectedContracts[c.id]===state.day)}
function contractExpiresAt(c){const a=state.acceptedContracts[c.id];return a?.expiresAt??null}
function expireContracts(forceDay=false){
 const now=totalMinutes();
 Object.entries(state.acceptedContracts).forEach(([id,a])=>{if(a.expiresAt!=null && now>=a.expiresAt){delete state.acceptedContracts[id];addLog(`CONTRACT EXPIRED: ${a.name||id}. The client moved on.`);applyWorldConsequence("missed-contract");toast(`Contract expired: ${a.name||id}`)}});
 if(forceDay){state.randomContracts=(state.randomContracts||[]).filter(c=>!c.expiresAt||c.expiresAt>now)}
}
function acceptContract(id){
 const c=[...CONTRACTS,...(state.randomContracts||[])].find(x=>x.id===id);if(!c||!ruleAvailable(c))return;
 if(state.acceptedContracts[id])return fail("You already accepted this contract.");
 const expiresAt=c.durationMinutes?totalMinutes()+c.durationMinutes:null;
 state.acceptedContracts[id]={acceptedAt:totalMinutes(),expiresAt,name:c.name};
 addLog(`Contract accepted: ${c.name}${expiresAt?` • expires ${timeText(expiresAt%1440)} Day ${Math.floor(expiresAt/1440)+1}`:" • no expiry"}.`);render();
}
function rejectContract(id){const c=[...CONTRACTS,...(state.randomContracts||[])].find(x=>x.id===id);if(!c)return;delete state.acceptedContracts[id];state.rejectedContracts[id]=state.day;addLog(`You reject ${c.name}. It may return with a future offer.`);render()}
function contractCanComplete(c){
 if(!state.acceptedContracts[c.id])return {ok:false,reason:"Accept the contract first."};
 if(c.type==="transport")return state.currentDistrict===c.destination?{ok:true}:{ok:false,reason:`Travel to ${getDistrictName(c.destination)}.`};
 const enough=Object.entries(c.requirements||{}).every(([id,q])=>(state.inventory[id]||0)>=q);
 return enough?{ok:true}:{ok:false,reason:"Missing required goods."};
}
function getDistrictName(id){return DISTRICTS.find(d=>d.id===id)?.name||id}
function finishContract(id){
 const c=[...CONTRACTS,...(state.randomContracts||[])].find(x=>x.id===id);if(!c)return;
 expireContracts();const check=contractCanComplete(c);if(!check.ok)return fail(check.reason);
 if(c.type!=="transport")Object.entries(c.requirements||{}).forEach(([k,q])=>state.inventory[k]-=q);
 const reward=c.reward||c.rewardRange||0;const payout=Array.isArray(reward)?Math.round(reward[0]+Math.random()*(reward[1]-reward[0])):reward;
 state.cash+=payout;state.lifetimeCash+=payout;state.completedContracts.push(c.id);delete state.acceptedContracts[c.id];state.knowledge+=2;
 const clientNpc=NPCS.find(n=>n.name===c.client);if(clientNpc)changeRelationship(clientNpc.id,5,"completed contract");
 addLog(`Contract completed: ${c.name}. You earn ${formatMoney(payout)}.`);checkUnlocks();render();
}
function generateRandomContracts(){
 if(!state.randomContracts)state.randomContracts=[];
 const now=totalMinutes();
 state.randomContracts=state.randomContracts.filter(c=>!c.expiresAt||c.expiresAt>now);
 if(state.randomContracts.length>=2)return;
 const count=2-state.randomContracts.length;
 for(let i=0;i<count;i++){
  const t=RANDOM_CONTRACT_TEMPLATES[Math.floor(Math.random()*RANDOM_CONTRACT_TEMPLATES.length)];
  const id=`random-${state.day}-${Date.now()}-${i}`;const reward=Math.round(t.reward[0]+Math.random()*(t.reward[1]-t.reward[0]));
  const req={};if(t.requirements)for(const [k,r] of Object.entries(t.requirements))req[k]=Math.round(r[0]+Math.random()*(r[1]-r[0]));
  const expiresAt=now+Math.floor((4+Math.random()*9)*60);
  state.randomContracts.push({id,name:t.name,client:"City Dispatch",description:t.description,district:t.districts[Math.floor(Math.random()*t.districts.length)],reward,requirements:req,type:t.kind,destination:t.destination,durationMinutes:expiresAt-now,expiresAt});
 }
}
function renderContracts(){
 const c=document.querySelector("#contracts");if(!c)return;expireContracts();generateRandomContracts();
 const all=[...CONTRACTS,...state.randomContracts].sort((a,b)=>{const ua=contractUnlocked(a),ub=contractUnlocked(b);if(ua!==ub)return ub-ua;const aa=!!state.acceptedContracts[a.id],ab=!!state.acceptedContracts[b.id];if(aa!==ab)return ab-aa;return (a.expiresAt||Infinity)-(b.expiresAt||Infinity)});
 c.innerHTML=all.map(x=>{
  const unlocked=contractUnlocked(x),accepted=!!state.acceptedContracts[x.id],done=state.completedContracts.includes(x.id),expires=contractExpiresAt(x),remaining=expires!=null?Math.max(0,expires-totalMinutes()):null;
  const needs=Object.entries(x.requirements||{}).map(([id,q])=>`${GOODS[id]?.name||id} ×${q}`).join(" • ");
  const check=accepted?contractCanComplete(x):null;
  let action="";
  if(!unlocked) action=`<div class="unlock-line">🔒 ${x.unlock?.label||"Locked"}</div>`;
  else if(done) action=`<span class="badge">COMPLETED</span>`;
  else if(accepted) action=`<div class="contract-meta"><span>${x.type==="transport"?`Destination: ${getDistrictName(x.destination)}`:`Needs: ${needs}`}</span><span>${expires==null?"NO EXPIRY":`Expires in ${formatDuration(remaining)}`}</span></div><div class="business-actions"><button class="business-button" data-finish-contract="${x.id}" ${check?.ok?"":"disabled"}>${check?.ok?"Complete":"Not Ready"}</button><button class="business-button secondary" data-reject-contract="${x.id}">Abandon</button></div>`;
  else action=`<div class="contract-meta"><span>${x.type==="transport"?`Destination: ${getDistrictName(x.destination)}`:`Needs: ${needs}`}</span><span>${x.durationMinutes?`Offer expires in ${formatDuration(x.durationMinutes)}`:"No expiry"}</span></div><div class="business-actions"><button class="business-button" data-accept-contract="${x.id}">Accept</button><button class="business-button secondary" data-reject-contract="${x.id}">Reject</button></div>`;
  return `<article class="contract-card ${unlocked?"":"locked-card"} ${accepted?"accepted-contract":""}"><div class="contract-head"><div><strong>${escapeHtml(unlocked?x.name:"Locked Contract")}</strong><span>${escapeHtml(unlocked?(x.client||"City Dispatch"):"Unknown Client")}</span></div><b>${unlocked?formatMoney(x.reward):"???"}</b></div><p>${escapeHtml(unlocked?x.description:`Requires ${x.unlock?.label||"another contact"}`)}</p>${action}</article>`;
 }).join("");
 document.querySelectorAll("[data-accept-contract]").forEach(b=>b.onclick=()=>acceptContract(b.dataset.acceptContract));
 document.querySelectorAll("[data-reject-contract]").forEach(b=>b.onclick=()=>rejectContract(b.dataset.rejectContract));
 document.querySelectorAll("[data-finish-contract]").forEach(b=>b.onclick=()=>finishContract(b.dataset.finishContract));
}
function formatDuration(min){min=Math.max(0,Math.round(min));const h=Math.floor(min/60),m=min%60;return h?`${h}h ${m}m`:`${m}m`}

function ownEstablishment(id){return state.ownedEstablishments.includes(id)}
function buyEstablishment(id){const e=ESTABLISHMENTS.find(x=>x.id===id);if(!e||ownEstablishment(id))return;if(getLevel("operation")<e.operationLevel)return fail(`Requires Operation level ${e.operationLevel}.`);if(state.cash<e.cost)return fail(`You need ${formatMoney(e.cost)}.`);state.cash-=e.cost;state.ownedEstablishments.push(id);addLog(`You acquire ${e.name} in ${getDistrictName(e.district)}.`);render()}
function produceAtEstablishment(id){const e=ESTABLISHMENTS.find(x=>x.id===id);if(!e||!ownEstablishment(id))return;if(state.currentDistrict!==e.district)return fail(`Travel to ${getDistrictName(e.district)} to use ${e.name}.`);if(!isHourInWindow(clockHour(),[[6,23]]))return fail(`${e.name} is not operating at this hour.`);const r=e.recipe;const estState=state.establishmentState[e.id]||{condition:100,runs:0};if(estState.condition<30)return fail(`${e.name} needs maintenance before another production run.`);if(state.energy<r.energy)return fail(`You need ${r.energy} energy.`);if(!hasTime(r.hours*60,`production at ${e.name}`))return;for(const [k,q] of Object.entries(r.inputs)){if((state.inventory[k]||0)<q)return fail(`You need ${q} ${GOODS[k].name}.`)}for(const [k,q] of Object.entries(r.inputs))state.inventory[k]-=q;state.energy-=r.energy;spendTime(r.hours*60,`production at ${e.name}`);const roll=Math.random();const marketHeat=Object.keys(r.outputs).reduce((sum,k)=>sum+marketMultiplierFor(k,e.district),0)/Math.max(1,Object.keys(r.outputs).length);let result="profit",factor=1;if(roll<.14){result="loss";factor=.25;applyWorldConsequence("failed-production")}else if(roll<.38){result="break-even";factor=.7}else if(roll>.88&&marketHeat>1.02){result="strong win";factor=1.55}else if(marketHeat<.82){result="soft loss";factor=.6}for(const [k,[lo,hi]] of Object.entries(r.outputs)){const qty=Math.max(0,Math.round((lo+Math.random()*(hi-lo))*factor));state.inventory[k]=(state.inventory[k]||0)+qty}state.productionRuns++;state.establishmentState[e.id]=state.establishmentState[e.id]||{runs:0,condition:100};state.establishmentState[e.id].runs++;state.establishmentState[e.id].condition=clamp(state.establishmentState[e.id].condition-(result==="loss"?4:1),25,100);if(state.establishmentState[e.id].condition<40)addLog(`${e.name} is wearing down. Future runs may require maintenance.`);addLog(`Production run at ${e.name}: ${result.toUpperCase()}. Market conditions influenced the outcome.`);render()}
function maintainEstablishment(id){const e=ESTABLISHMENTS.find(x=>x.id===id);if(!e||!ownEstablishment(id))return;const st=state.establishmentState[id]||{condition:100,runs:0};if(st.condition>=100)return toast(`${e.name} is already in top condition.`);const cost=Math.max(35,Math.round(e.cost*.025*(100-st.condition)/100));if(state.cash<cost)return fail(`You need ${formatMoney(cost)} to maintain ${e.name}.`);state.cash-=cost;st.condition=100;state.establishmentState[id]=st;addLog(`You maintain ${e.name} for ${formatMoney(cost)}.`);render()}
function renderEstablishments(){const c=document.querySelector("#establishments");if(!c)return;const groups={home:[],shop:[],"material-shop":[],production:[]};ESTABLISHMENTS.forEach(e=>(groups[e.category||"production"]||groups.production).push(e));c.innerHTML=Object.entries(groups).filter(([,arr])=>arr.length).map(([cat,arr])=>`<div class="est-group"><div class="group-title">${cat==="home"?"Homes & Rest":cat==="shop"?"Shops & Retail":cat==="material-shop"?"Production Suppliers":"Production Operations"}</div>${arr.map(e=>{const owned=ownEstablishment(e.id),canLevel=getLevel("operation")>=e.operationLevel,here=state.currentDistrict===e.district;const isHome=e.category==="home",isShop=e.category==="shop"||e.category==="material-shop";const inputs=Object.entries(e.recipe.inputs).map(([k,q])=>`${GOODS[k].name} ×${q}`).join(" • ")||"None";const outputs=Object.entries(e.recipe.outputs).map(([k,r])=>`${GOODS[k].name} ${r[0]}–${r[1]}`).join(" • ")||"None";let action=isHome?`<button class="business-button" data-home="${e.id}" ${here&&owned?"":"disabled"}>${here?"Use Home":"Travel Here"}</button>`:isShop?`<button class="business-button" data-shop-est="${e.id}" ${owned&&here?"":"disabled"}>${owned?(here?"Manage Shop":"Travel Here"):"Buy Establishment"}</button>`:`<button class="business-button" data-produce="${e.id}" ${owned&&here&&canLevel?"":"disabled"}>${owned?(here?"Run Production":"Travel Here"):"Buy Establishment"}</button>`;return `<article class="business-card ${owned?"accepted-contract":""}"><div class="business-header"><div><div class="business-name">${e.name}</div><div class="business-type">${getDistrictName(e.district)} • ${e.description}</div></div><span class="business-status">${owned?"OWNED":formatMoney(e.cost)+" • OP "+e.operationLevel}</span></div><p class="business-description">${isHome?"Sleep, recover and manage your personal base.":isShop?`Shop inventory is randomized by time of day. Current stock changes when the city shifts periods.<br><b>Shop role:</b> Stock, price and customer demand change by period.`:`<b>Input:</b> ${inputs}<br><b>Random output:</b> ${outputs}<br><b>Run time:</b> ${e.recipe.hours}h • <b>Energy:</b> ${e.recipe.energy}`}</p><div class="business-actions">${owned?action:`<button class="business-button" data-buy-est="${e.id}" ${canLevel?"":"disabled"}>Buy Establishment</button>`}${owned&&!isHome&&!isShop?`<button class="business-button secondary" data-maintain="${e.id}">Maintain ${state.establishmentState[e.id]?.condition??100}%</button>`:""}</div></article>`}).join("")}</div>`).join("");document.querySelectorAll("[data-produce]").forEach(b=>b.onclick=()=>produceAtEstablishment(b.dataset.produce));document.querySelectorAll("[data-buy-est]").forEach(b=>b.onclick=()=>buyEstablishment(b.dataset.buyEst));document.querySelectorAll("[data-home]").forEach(b=>b.onclick=()=>{addLog(`You spend time at ${ESTABLISHMENTS.find(e=>e.id===b.dataset.home).name}.`);sleepFor(6);});document.querySelectorAll("[data-shop-est]").forEach(b=>b.onclick=()=>toast("Shop management is open here; stock updates by time period."));document.querySelectorAll("[data-maintain]").forEach(b=>b.onclick=()=>maintainEstablishment(b.dataset.maintain))}

function marketBusinessForDistrict(districtId){const bs=BUSINESSES.filter(b=>b.district===districtId&&businessUnlocked(b));return bs[0]||null}
function tradeGoodAtDistrict(id,qty,mode,districtId){if(districtId!==state.currentDistrict)return fail(`You are browsing ${getDistrictName(districtId)}. Travel there to trade.`);if(mode==="buy")buyGood(id,qty);else sellGood(id,qty)}
function setMarketView(id){if(!DISTRICTS.some(d=>d.id===id))return;state.marketViewDistrict=id;renderMarket()}
function renderMarket(){
 const c=document.querySelector("#market");if(!c)return;const view=state.marketViewDistrict||state.currentDistrict,b=marketBusinessForDistrict(view),canTrade=view===state.currentDistrict,stock=b&&SHOP_STOCKS[b.id]?ensureShopStock(b.id):null;
 c.innerHTML=`<div class="market-summary"><div><span class="muted">MARKET BROWSER</span><strong>${getDistrictName(view)}</strong></div><div><span class="muted">PRIMARY SHOP</span><strong>${b?b.name:"Independent Trading"}</strong></div><label class="market-select-label">Browse <select id="marketDistrictSelect" class="market-select">${DISTRICTS.map(d=>`<option value="${d.id}" ${d.id===view?"selected":""}>${d.name}</option>`).join("")}</select></label></div><div class="market-note">${canTrade?"You are here — buying and selling are enabled.":"Browse-only view. Travel to this district to trade at these prices."}</div><div class="market-grid">${Object.entries(GOODS).map(([id,g])=>{const m=marketMultiplierFor(id,state.currentDistrict),condition=marketCondition(m),buy=Math.round(g.basePrice*m*(b?b.buyMultiplier:1)*DEV_CONFIG.economy.globalPriceMultiplier*100)/100,sell=Math.round(g.basePrice*m*(b?b.sellMultiplier:1)*DEV_CONFIG.economy.globalPriceMultiplier*DEV_CONFIG.economy.sellPriceMultiplier*100)/100,owned=state.inventory[id],demand=clamp(Math.round((m-.65)/.85*100),0,100),supply=100-demand;return `<div class="good-card"><div class="good-header"><div><strong>${g.name}</strong><span>Market good</span></div><span class="owned">Owned: ${owned}${stock?` • Shop stock: ${stock[id]||0}`:""}</span></div><p>${g.description}</p><span class="market-condition">${condition} <em class="market-signal ${marketSignal(m).cls}">${marketSignal(m).icon} ${marketSignal(m).label}</em></span><div class="market-bars"><div class="market-bar-row"><span>Supply</span><div class="market-bar"><div class="market-bar-fill" style="width:${supply}%"></div></div><strong>${supply}</strong></div><div class="market-bar-row"><span>Demand</span><div class="market-bar"><div class="market-bar-fill" style="width:${demand}%"></div></div><strong>${demand}</strong></div></div><div class="price-row"><div><span class="price-label">BUY</span><strong>${formatMoney(buy)}</strong></div><div><span class="price-label">SELL</span><strong>${formatMoney(sell)}</strong></div></div><div class="market-buttons"><button class="market-button" data-market-buy="${id}" ${canTrade?"":"disabled"}>Buy 1</button><button class="market-button" data-market-sell="${id}" ${!canTrade||owned<=0?"disabled":""}>Sell 1</button></div></div>`}).join("")}</div>`;
 const marketSelect=document.querySelector("#marketDistrictSelect");if(marketSelect)marketSelect.onchange=e=>setMarketView(e.target.value);document.querySelectorAll("[data-market-buy]").forEach(x=>x.onclick=()=>tradeGoodAtDistrict(x.dataset.marketBuy,1,"buy",view));document.querySelectorAll("[data-market-sell]").forEach(x=>x.onclick=()=>tradeGoodAtDistrict(x.dataset.marketSell,1,"sell",view));
}
function auctionIsOpen(h){return h && isHourInWindow(clockHour(),h.openHours)}
function ensureAuction(houseId){
 const h=AUCTION_HOUSES.find(x=>x.id===houseId); if(!h)return null;
 if(!state.auctions)state.auctions={}; let a=state.auctions[houseId];
 if(!a||a.day!==state.day){
  if(Math.random()>h.chance){a={day:state.day,available:false,lot:null};state.auctions[houseId]=a;return a}
  const pool=AUCTION_ITEMS.filter(x=>!x.houses||x.houses.includes(h.id)||(!h.smuggle&&!x.smuggle));
  const item=(pool.length?pool:AUCTION_ITEMS)[Math.floor(Math.random()*(pool.length?pool:AUCTION_ITEMS).length)];
  const qty=Math.round(item.qty[0]+Math.random()*(item.qty[1]-item.qty[0])); const base=Math.round(item.base[0]+Math.random()*(item.base[1]-item.base[0]));
  a={day:state.day,available:true,lot:{item:item.item,qty,startingBid:base,smuggle:!!(h.smuggle&&Math.random()<.35)},currentBid:base,playerBid:0,highBidder:false,finalized:false};state.auctions[houseId]=a;
 }
 return a;
}
function placeAuctionBid(houseId){const h=AUCTION_HOUSES.find(x=>x.id===houseId),a=ensureAuction(houseId);if(!h||!a?.available)return fail("No auction is appearing here today.");if(state.currentDistrict!==h.district)return fail(`Travel to ${h.district} to bid.`);if(!auctionIsOpen(h))return fail("This auction is closed right now.");if(a.finalized)return fail("This lot is already finalized.");const next=a.currentBid+Math.max(10,Math.round(a.currentBid*.1));if(state.cash<next)return fail(`You need ${formatMoney(next)} for the next bid.`);state.cash-=next;a.currentBid=next;a.playerBid=next;a.highBidder=true;const rivalChance=.18+(state.worldConsequences?.auctionInterest||0)*.02;if(Math.random()<rivalChance){state.cash+=next;a.currentBid+=Math.max(10,Math.round(a.currentBid*.12));a.highBidder=false;a.playerBid=0;addLog(`An auction rival outbids you at ${formatMoney(a.currentBid)}.`)}else addLog(`You lead ${h.name} at ${formatMoney(next)}.`);render()}
function finalizeAuction(houseId){const h=AUCTION_HOUSES.find(x=>x.id===houseId),a=ensureAuction(houseId);if(!h||!a?.available)return fail("No auction lot is available.");if(state.currentDistrict!==h.district)return fail(`Travel to ${h.district} to collect the lot.`);if(!auctionIsOpen(h))return fail("The auction is closed.");if(!a.highBidder)return fail("You are not the winning bidder.");const {item,qty,smuggle}=a.lot;if(materialCount()+qty>storageCapacity())return fail("Your storage cannot hold the auction lot.");state.inventory[item]+=qty;a.finalized=true;state.knowledge+=smuggle?3:1;addLog(`Auction won at ${h.name}: ${qty} ${GOODS[item].name} for ${formatMoney(a.currentBid)}${smuggle?". This was an undeclared lot — keep a low profile.":"."}`);if(smuggle){applyWorldConsequence("auction-smuggle");if(Math.random()<.25){state.cash=Math.max(0,state.cash-25);addLog("A port inspection costs you ₱25 in unofficial fees.")}}state.auctionHistory.unshift({day:state.day,house:h.name,item,qty,bid:a.currentBid,smuggle});state.auctionHistory=state.auctionHistory.slice(0,50);render()}
function renderAuction(){const c=document.querySelector("#auction");if(!c)return;const houses=AUCTION_HOUSES.filter(h=>h.district===state.currentDistrict);if(!houses.length){c.innerHTML='<div class="empty-state">No auction house operates in this district.</div>';return}c.innerHTML=houses.map(h=>{const a=ensureAuction(h.id);if(!a.available)return `<div class="auction-card auction-muted"><div class="auction-head"><div><span class="muted">${h.name.toUpperCase()}</span><h3>No lot today</h3></div><span class="badge">NO AUCTION</span></div><p>${h.description} The auction may appear on another day.</p></div>`;const lot=a.lot,can=auctionIsOpen(h),owned=materialCount()+lot.qty<=storageCapacity();return `<div class="auction-card ${lot.smuggle?'smuggle-lot':''}"><div class="auction-head"><div><span class="muted">${h.name.toUpperCase()} ${lot.smuggle?'• RISK LOT':''}</span><h3>${GOODS[lot.item].name} ×${lot.qty}</h3></div><span class="badge">${can?'LIVE':'OFF HOURS'}</span></div><p>${h.description}</p><p>Starting bid ${formatMoney(lot.startingBid)} • Current bid <strong>${formatMoney(a.currentBid)}</strong>.</p><p>${a.highBidder?'You are currently leading.':'Another bidder may be leading.'}${lot.smuggle?' Smuggle risk: this lot may carry extra consequences.':''}</p><div class="business-actions"><button class="business-button" data-auction-bid="${h.id}" ${can&&!a.finalized?'':'disabled'}>Place Bid</button><button class="business-button" data-auction-finalize="${h.id}" ${can&&a.highBidder&&!a.finalized&&owned?'':'disabled'}>Claim Lot</button></div></div>`}).join('');c.querySelectorAll('[data-auction-bid]').forEach(b=>b.onclick=()=>placeAuctionBid(b.dataset.auctionBid));c.querySelectorAll('[data-auction-finalize]').forEach(b=>b.onclick=()=>finalizeAuction(b.dataset.auctionFinalize))}

function renderNews(){const el=document.querySelector("#news");if(!el)return;const news=state.dailyNews||[];el.innerHTML=news.length?news.map((n,i)=>`<div class="news-item"><span class="news-time">${i===0?"LEAD":"CITY"}</span><span>${escapeHtml(n)}</span></div>`).join(""):"<div class='empty-state'>No newspaper edition yet.</div>"}
function renderEstablishmentGroups(){const c=document.querySelector("#establishments");if(!c)return;}
function render(){renderStats();renderActions();renderNews();renderUpgrades();renderSituation();renderDistricts();renderMarket();renderInventory();renderBusinesses();renderContacts();renderContracts();renderEstablishments();renderAuction();renderCharacter();renderLog();renderUnlocks();renderEvent();renderDevValues()}

function renderLog(){const top=document.querySelector("#logTop"),archive=document.querySelector("#log"),today=state.dailyLog||[];if(top)top.innerHTML=today.length?today.map(x=>`<div class="log-entry"><small>${escapeHtml(x.time)}</small>${escapeHtml(x.text)}</div>`).join(""):"<div class='empty-state'>Nothing has happened today yet.</div>";const range=Number(state.historyRange||7),minDay=range>=9999?0:Math.max(1,state.day-range+1),rows=(state.history||[]).filter(x=>x.day>=minDay);if(archive)archive.innerHTML=rows.length?rows.map(x=>`<div class="log-entry"><small>${escapeHtml(x.date)} • Day ${x.day} • ${escapeHtml(x.time)}</small>${escapeHtml(x.text)}</div>`).join(""):"<div class='empty-state'>No history in this range.</div>";const sel=document.querySelector("#historyRange");if(sel){sel.value=String(state.historyRange||7);sel.onchange=()=>{state.historyRange=Number(sel.value);renderLog()}}}
function setDifficulty(key){if(!DIFFICULTIES[key])return;state=freshState(key);state.startStorySeen=false;addLog(`New ${DIFFICULTIES[key].name} run started.`);localStorage.removeItem(GAME_CONFIG.saveKey);render();closeDifficulty();document.querySelector("#mainMenu")?.classList.add("hidden");showStartStory();toast(`${DIFFICULTIES[key].name} difficulty started.`)}
function renderDifficultyChoices(){const c=document.querySelector("#difficultyChoices");c.innerHTML=Object.entries(DIFFICULTIES).map(([id,d])=>`<button class="difficulty-card ${state.difficulty===id?"selected":""}" data-difficulty="${id}"><strong>${d.name}</strong><span>${d.description}</span><small>Start ${formatMoney(d.startingCash)} • ${d.startingFood} food • ${d.startingEnergy} energy</small></button>`).join("");document.querySelectorAll("[data-difficulty]").forEach(b=>b.onclick=()=>setDifficulty(b.dataset.difficulty))}
function openDifficulty(){document.querySelector("#difficultyModal").classList.add("show");renderDifficultyChoices()}
function closeDifficulty(){document.querySelector("#difficultyModal").classList.remove("show")}

/* -------------------- Hidden developer console -------------------- */
const DEV_DEFAULTS=JSON.parse(JSON.stringify(DEV_CONFIG));
let devUndoSnapshot=null;
function devSnapshot(){devUndoSnapshot=JSON.parse(JSON.stringify(state));}
function devUndo(){if(!devUndoSnapshot)return toast("Nothing to undo.");state=devUndoSnapshot;devUndoSnapshot=null;render();toast("Last developer change undone.");}
function devPasswordOk(password){return password==="ScrapDev!2026"}
function openDev(){if(!DEV_CONFIG.enabled)return;document.querySelector("#devAuthModal").classList.add("show");document.querySelector("#devPassword").value="";document.querySelector("#devPassword").focus()}
function unlockDev(){const pass=document.querySelector("#devPassword").value;if(!devPasswordOk(pass))return toast("Developer access denied.");document.querySelector("#devAuthModal").classList.remove("show");document.querySelector("#devPanel").classList.add("show");renderDevValues()}
function renderDevValues(){const ids=["devJobReward","devBuy","devSell","devHealth","devEnergy","devMarket","devTravel","devEventChance"];ids.forEach(id=>{const e=document.querySelector("#"+id);if(!e)return;const map={devJobReward:[DEV_CONFIG.economy,"jobRewardMultiplier"],devBuy:[DEV_CONFIG.economy,"globalPriceMultiplier"],devSell:[DEV_CONFIG.economy,"sellPriceMultiplier"],devHealth:[DEV_CONFIG.survival,"healthDrainMultiplier"],devEnergy:[DEV_CONFIG.survival,"energyRecoveryMultiplier"],devMarket:[DEV_CONFIG.market,"volatilityMultiplier"],devTravel:[DEV_CONFIG.travel,"costMultiplier"],devEventChance:[DEV_CONFIG.events,"rareChance"]};e.value=map[id][0][map[id][1]];const o=document.querySelector("#"+id+"Value");if(o)o.textContent=(Number(e.value)*100).toFixed(id==="devEventChance"?1:0)+(id==="devEventChance"?"%":"%")})}
function bindDev(){const map={devJobReward:[DEV_CONFIG.economy,"jobRewardMultiplier"],devBuy:[DEV_CONFIG.economy,"globalPriceMultiplier"],devSell:[DEV_CONFIG.economy,"sellPriceMultiplier"],devHealth:[DEV_CONFIG.survival,"healthDrainMultiplier"],devEnergy:[DEV_CONFIG.survival,"energyRecoveryMultiplier"],devMarket:[DEV_CONFIG.market,"volatilityMultiplier"],devTravel:[DEV_CONFIG.travel,"costMultiplier"],devEventChance:[DEV_CONFIG.events,"rareChance"]};Object.entries(map).forEach(([id,[obj,key]])=>{const e=document.querySelector("#"+id);if(e)e.oninput=()=>{if(!devUndoSnapshot)devSnapshot();obj[key]=Number(e.value);renderDevValues();render()}})}
function resetDev(){devSnapshot();Object.keys(DEV_DEFAULTS).forEach(k=>{if(typeof DEV_DEFAULTS[k]==="object")DEV_CONFIG[k]=JSON.parse(JSON.stringify(DEV_DEFAULTS[k]));else DEV_CONFIG[k]=DEV_DEFAULTS[k]});render();toast("Developer settings reset.")}
function devAddMoney(){devSnapshot();const n=Number(prompt("Amount of PHP to add:","1000"));if(!Number.isFinite(n)||n===0)return;state.cash=Math.max(0,state.cash+n);if(n>0)state.lifetimeCash+=n;addLog(`DEV: Cash adjusted by ${formatMoney(n)}.`);render()}
function devSetTime(){devSnapshot();const raw=prompt("Set time (HH:MM, 24-hour):",`${String(clockHour()).padStart(2,"0")}:00`);if(!raw)return;const m=raw.match(/^(\d{1,2}):(\d{2})$/);if(!m)return toast("Use HH:MM.");const h=Number(m[1]),min=Number(m[2]);if(h>23||min>59)return toast("Invalid time.");state.timeMinutes=h*60+min;render();toast(`Time set to ${timeText(state.timeMinutes)}.`)}
function devUnlockAll(){devSnapshot();state.unlockedBusinesses=BUSINESSES.map(b=>b.id);state.unlockedContracts=CONTRACTS.map(c=>c.id);state.unlockedNPCs=NPCS.map(n=>n.id);state.ownedEstablishments=ESTABLISHMENTS.map(e=>e.id);state.knowledge=Math.max(state.knowledge,99);addLog("DEV: All locked contacts, businesses and contracts unlocked.");render();toast("All locked features unlocked.")}
function devAddKnowledge(){devSnapshot();const n=Number(prompt("Knowledge to add:","10"));if(!Number.isFinite(n))return;state.knowledge=Math.max(0,state.knowledge+Math.floor(n));addLog(`DEV: Knowledge adjusted by ${Math.floor(n)}.`);render()}
function devGiveItem(){devSnapshot();const id=prompt(`Item id (${Object.keys(GOODS).join(", ")}):`,"scrapMetal");if(!GOODS[id])return toast("Unknown item.");const q=Number(prompt("Quantity:","10"));if(!Number.isFinite(q)||q<=0)return;state.inventory[id]=(state.inventory[id]||0)+Math.floor(q);state.food=state.inventory.food;addLog(`DEV: Added ${Math.floor(q)} ${GOODS[id].name}.`);render()}
function devSetCash(){devSnapshot();const n=Number(prompt("Set cash (PHP):",String(Math.round(state.cash))));if(!Number.isFinite(n)||n<0)return;state.cash=n;addLog(`DEV: Cash set to ${formatMoney(n)}.`);render()}
function devSetVitals(){devSnapshot();const h=Number(prompt("Set health (0-100):",String(state.health)));const e=Number(prompt("Set energy (0-100):",String(state.energy)));if(!Number.isFinite(h)||!Number.isFinite(e))return;state.health=clamp(Math.round(h),0,100);state.energy=clamp(Math.round(e),0,100);addLog(`DEV: Vitals set to ${state.health}% health / ${state.energy}% energy.`);render()}
function devSetRep(){devSnapshot();const id=prompt(`NPC id (${NPCS.map(n=>n.id).join(", ")}):`,NPCS[0].id);const n=getNPC(id);if(!n)return toast("Unknown NPC.");const rep=Number(prompt(`Set ${n.name} reputation (-100 to 100):`,String(state.npcRep[id]||0)));if(!Number.isFinite(rep))return;state.npcRep[id]=clamp(Math.round(rep),-100,100);checkUnlocks();addLog(`DEV: ${n.name} reputation set to ${state.npcRep[id]}.`);render()}
function devSetMarket(){devSnapshot();const id=prompt(`Good id (${Object.keys(GOODS).join(", ")}):`,"scrapMetal");if(!GOODS[id])return toast("Unknown item.");const m=Number(prompt("Set market multiplier (0.65 - 1.50):",String(state.marketMultiplier[id]||1)));if(!Number.isFinite(m))return;state.marketMultiplier[id]=clamp(m,DEV_CONFIG.market.min,DEV_CONFIG.market.max);addLog(`DEV: ${GOODS[id].name} market multiplier set to ${state.marketMultiplier[id].toFixed(2)}.`);render()}
function devTriggerEvent(){devSnapshot();const pool=EVENTS.filter(e=>!e.districts||e.districts.includes(state.currentDistrict));if(!pool.length)return;const id=prompt(`Event id (${pool.map(e=>e.id).join(", ")}):`,pool[0].id);const e=EVENTS.find(x=>x.id===id);if(!e)return toast("Unknown event for this district.");state.activeEvent=e.id;state.districtAlerts=state.districtAlerts||{};state.districtAlerts[state.currentDistrict]={label:e.name,expiresAt:totalMinutes()+240};applyEvent(e)}
function devAdvanceTime(){devSnapshot();const h=Number(prompt("Advance time by hours:","1"));if(!Number.isFinite(h)||h<0)return;advanceTime(Math.round(h*60));addLog(`DEV: Advanced time by ${h} hour${h===1?"":"s"}.`);render()}
function devSetDay(){devSnapshot();const d=Number(prompt("Set in-game day (1+):",String(state.day)));if(!Number.isInteger(d)||d<1)return toast("Invalid day.");state.day=d;addLog(`DEV: Day set to ${d}.`);render()}
function devSetOperation(){devSnapshot();const level=Number(prompt("Set Operation Rank (0-3):",String(getLevel("operation"))));if(!Number.isInteger(level)||level<0||level>3)return toast("Use 0, 1, 2 or 3.");state.progression.operation=level;checkUnlocks();addLog(`DEV: Operation Rank set to ${getCurrentUpgrade("operation").name}.`);render()}
function devToggle(key){devSnapshot();if(key==="events")DEV_CONFIG.events.enabled=!DEV_CONFIG.events.enabled;if(key==="time")DEV_CONFIG.time.enabled=!DEV_CONFIG.time.enabled;if(key==="market")DEV_CONFIG.market.enabled=!DEV_CONFIG.market.enabled;addLog(`DEV: ${key} system ${DEV_CONFIG[key]?.enabled===false?"disabled":"enabled"}.`);render();renderDevValues()}

/* -------------------- Accordion UI -------------------- */
function bindAccordions(){document.querySelectorAll("[data-collapse]").forEach(btn=>btn.onclick=()=>{const target=document.querySelector(btn.dataset.collapse);if(!target)return;target.classList.toggle("collapsed");btn.setAttribute("aria-expanded",String(!target.classList.contains("collapsed")))})}

function bindClick(id, handler){const el=document.querySelector("#"+id);if(el)el.onclick=handler;}
bindClick("nextTurnBtn",endTurn);
bindClick("resetBtn",()=>{if(confirm("Reset the game and erase the current browser save?")){state=freshState();addLog(`A new game begins. ${state.startStory.title} sets your first direction.`);localStorage.removeItem(GAME_CONFIG.saveKey);render();showStartStory();toast("New sandbox started.")}});
bindClick("saveBtn",saveGame);
bindClick("difficultyBtn",openDifficulty);
bindClick("closeDifficulty",closeDifficulty);
bindClick("devAuthClose",()=>document.querySelector("#devAuthModal")?.classList.remove("show"));
bindClick("devUnlockBtn",unlockDev);
const devPasswordEl=document.querySelector("#devPassword");if(devPasswordEl)devPasswordEl.onkeydown=e=>{if(e.key==="Enter")unlockDev()};
bindClick("devClose",()=>document.querySelector("#devPanel")?.classList.remove("show"));
bindClick("devReset",resetDev);
bindClick("devSaveConfig",saveDevConfig);
bindClick("devAddMoney",devAddMoney);
bindClick("devSetTime",devSetTime);
bindClick("devGiveItem",devGiveItem);
bindClick("devUnlockAll",devUnlockAll);
bindClick("devAddKnowledge",devAddKnowledge);
bindClick("devUndo",devUndo);
bindClick("devSetCash",devSetCash);
bindClick("devSetVitals",devSetVitals);
bindClick("devSetRep",devSetRep);
bindClick("devSetMarket",devSetMarket);
bindClick("devTriggerEvent",devTriggerEvent);
bindClick("devAdvanceTime",devAdvanceTime);
bindClick("devSetDay",devSetDay);
bindClick("devSetOperation",devSetOperation);
bindClick("devToggleEvents",()=>devToggle("events"));
bindClick("devToggleTime",()=>devToggle("time"));
bindClick("devToggleMarket",()=>devToggle("market"));
document.addEventListener("keydown",e=>{if(e.ctrlKey&&e.shiftKey&&e.key.toLowerCase()==="d"){e.preventDefault();openDev()}});
bindDev();bindAccordions();

// -------------------- Safe startup --------------------
// The title screen controls whether a saved game is resumed or a new sandbox begins.
// We intentionally do not auto-resume so every launch starts at the front menu.
let loadedGame=false;
loadDevConfig();
const savedAvailable=!!localStorage.getItem(GAME_CONFIG.saveKey);
ensureWorldSystems();
refreshAllShops();
updateNPCActivity();
publishDailyNews();
if(savedAvailable){
  const status=document.querySelector("#menuSaveStatus");
  if(status)status.textContent="A browser save is available. Choose Resume Game or Saved Games.";
}
checkUnlocks();
render();
renderDifficultyChoices();

/* Main menu / save slots */
const SAVE_SLOTS_KEY="sst_save_slots_v1";
function getSaveSlots(){try{return JSON.parse(localStorage.getItem(SAVE_SLOTS_KEY)||"{}")||{}}catch(e){return {}}}
function setSaveSlots(slots){localStorage.setItem(SAVE_SLOTS_KEY,JSON.stringify(slots))}
function saveStateToSlot(slot){
  const slots=getSaveSlots();
  slots[String(slot)]={savedAt:new Date().toISOString(),state:JSON.parse(JSON.stringify(state))};
  setSaveSlots(slots); toast(`Saved to Slot ${slot}.`); renderSaveSlots();
}
function loadStateFromSlot(slot){
  const data=getSaveSlots()[String(slot)];
  if(!data?.state)return toast(`Slot ${slot} is empty.`);
  restoreSavedState(data.state);
  closeModal("saveSlotsModal");
  document.querySelector("#mainMenu")?.classList.add("hidden");
  render();
  toast(`Slot ${slot} loaded.`);
}
function deleteSaveSlot(slot){const slots=getSaveSlots();delete slots[String(slot)];setSaveSlots(slots);renderSaveSlots();toast(`Slot ${slot} deleted.`)}
function restoreSavedState(saved){
  const base=freshState(saved.difficulty||"normal");
  state=Object.assign(base,saved);
  state.startDate=saved.startDate||base.startDate;
  state.history=saved.history||[];state.dailyLog=saved.dailyLog||[];state.historyRange=saved.historyRange||7;
  state.inventory=Object.assign(base.inventory,saved.inventory||{});state.progression=Object.assign(base.progression,saved.progression||{});state.npcRep=Object.assign(base.npcRep,saved.npcRep||{});state.marketMultiplier=Object.assign(base.marketMultiplier,saved.marketMultiplier||{});state.marketByDistrict=Object.assign(base.marketByDistrict,saved.marketByDistrict||{});state.relationships=Object.assign(base.relationships,saved.relationships||{});state.worldConsequences=Object.assign(base.worldConsequences,saved.worldConsequences||{});state.establishmentState=Object.assign(base.establishmentState,saved.establishmentState||{});state.auctionHistory=saved.auctionHistory||[];ensureWorldSystems();
  state.unlockedBusinesses=saved.unlockedBusinesses||[];state.completedContracts=saved.completedContracts||[];state.unlockedNPCs=saved.unlockedNPCs||[];state.unlockedContracts=saved.unlockedContracts||[];state.acceptedContracts=saved.acceptedContracts||{};state.rejectedContracts=saved.rejectedContracts||{};state.randomContracts=saved.randomContracts||[];state.ownedEstablishments=saved.ownedEstablishments||[];state.productionRuns=saved.productionRuns||0;state.auctions=saved.auctions||{};state.shopStocks=saved.shopStocks||{};state.shopSales=saved.shopSales||{};state.npcActivity=saved.npcActivity||{};state.dailyNews=saved.dailyNews||[];state.districtAlerts=saved.districtAlerts||{};state.marketViewDistrict=saved.marketViewDistrict||state.currentDistrict;state.knowledge=Number.isFinite(saved.knowledge)?saved.knowledge:0;state.lastPeriod=saved.lastPeriod||timePeriod(state.timeMinutes);
  for(const id of Object.keys(base.inventory))state.inventory[id]=Number.isFinite(state.inventory[id])?state.inventory[id]:0;
  checkUnlocks(); generateRandomContracts();
}
function renderSaveSlots(){
  const c=document.querySelector("#saveSlots");if(!c)return;const slots=getSaveSlots();
  c.innerHTML=[1,2,3,4].map(i=>{const d=slots[String(i)];const meta=d?.state;return `<div class="save-slot"><div class="save-slot-info"><strong>Slot ${i}</strong><span>${d?`Day ${meta.day||1} • ${meta.startDate||"Unknown date"} • ${meta.difficulty||"Normal"}`:"Empty slot"}</span><span>${d?new Date(d.savedAt).toLocaleString():"No game saved here"}</span></div><div class="save-slot-actions"><button data-slot-load="${i}" ${d?"":"disabled"}>▶ Load</button><button data-slot-save="${i}">💾 Save Here</button>${d?`<button data-slot-delete="${i}">🗑 Delete</button>`:""}</div></div>`}).join("");
  c.querySelectorAll("[data-slot-load]").forEach(b=>b.onclick=()=>loadStateFromSlot(b.dataset.slotLoad));c.querySelectorAll("[data-slot-save]").forEach(b=>b.onclick=()=>saveStateToSlot(b.dataset.slotSave));c.querySelectorAll("[data-slot-delete]").forEach(b=>b.onclick=()=>{if(confirm(`Delete Slot ${b.dataset.slotDelete}?`))deleteSaveSlot(b.dataset.slotDelete)});
}
function openSaveSlots(){renderSaveSlots();openModal("saveSlotsModal")}
function openMainMenu(){document.querySelector("#mainMenu")?.classList.remove("hidden")}
function startNewGame(){document.querySelector("#mainMenu")?.classList.add("hidden");openDifficulty()}
function resumeGame(){
  if(loadGame()){document.querySelector("#mainMenu")?.classList.add("hidden");render();toast("Game resumed.");return}
  const slots=getSaveSlots();
  const entries=Object.entries(slots).filter(([,v])=>v?.state).sort((a,b)=>new Date(b[1].savedAt)-new Date(a[1].savedAt));
  if(entries.length){loadStateFromSlot(entries[0][0]);return}
  toast("No saved game exists yet. Start a New Game.")
}
function menuSettings(){document.querySelector("#mainMenu")?.classList.add("hidden");const m=document.querySelector("#systemMenu");if(m)m.hidden=false}
function menuExit(){const status=document.querySelector("#menuSaveStatus");if(status)status.textContent="The browser does not allow the game to close its own tab. Your game is safe; you can close this tab/window normally."}
document.querySelector("#newGameBtn")?.addEventListener("click",startNewGame);
document.querySelector("#resumeGameBtn")?.addEventListener("click",resumeGame);
document.querySelector("#saveGamesBtn")?.addEventListener("click",openSaveSlots);
document.querySelector("#menuHelpBtn")?.addEventListener("click",()=>{document.querySelector("#mainMenu")?.classList.add("hidden");openHelp()});
document.querySelector("#menuSettingsBtn")?.addEventListener("click",menuSettings);
document.querySelector("#exitGameBtn")?.addEventListener("click",menuExit);
document.querySelector("#saveSlotsClose")?.addEventListener("click",()=>closeModal("saveSlotsModal"));
document.querySelector("#saveSlotsModal")?.addEventListener("click",e=>{if(e.target.id==="saveSlotsModal")closeModal("saveSlotsModal")});

// Story is shown after difficulty selection for a new game.
/* Start story */
function showStartStory(){
 const modal=document.querySelector("#startStoryModal");if(!modal)return;
 const story=state.startStory||pickStartStory();state.startStory=story;
 const title=document.querySelector("#startStoryTitle"),body=document.querySelector("#startStoryBody"),goal=document.querySelector("#startStoryGoal");
 if(title)title.textContent=story.title;if(body)body.textContent=story.body;if(goal)goal.textContent=story.goal;
 modal.classList.add("show");state.startStorySeen=true;
}
function closeStartStory(){document.querySelector("#startStoryModal")?.classList.remove("show");saveGame()}

/* Help manual */
function openHelp(){document.querySelector("#helpModal")?.classList.add("show")}
function closeHelp(){document.querySelector("#helpModal")?.classList.remove("show")}
document.querySelector("#helpBtn")?.addEventListener("click",openHelp);
document.querySelector("#helpClose")?.addEventListener("click",closeHelp);document.querySelector("#startStoryClose")?.addEventListener("click",closeStartStory);document.querySelectorAll("[data-help-tab]").forEach(b=>b.addEventListener("click",()=>{document.querySelectorAll("[data-help-tab]").forEach(x=>x.classList.toggle("active",x===b));document.querySelectorAll(".help-pane").forEach(p=>p.classList.remove("active"));document.querySelector(`#help${b.dataset.helpTab.charAt(0).toUpperCase()+b.dataset.helpTab.slice(1)}`)?.classList.add("active")}));

/* ============================================================
   v9 UTILITY UI — backpack / profile / phone
   ============================================================ */
function openModal(id){const el=document.getElementById(id);if(el)el.classList.add("show")}
function closeModal(id){const el=document.getElementById(id);if(el)el.classList.remove("show")}
function openBackpack(){openModal("backpackModal");renderInventory()}
function openProfile(){openModal("profileModal");renderCharacter()}
function openPhone(tab="contacts"){openModal("phoneModal");setPhoneTab(tab);renderPhone();renderMarket();renderCalendar();}
function setPhoneTab(tab){document.querySelectorAll("[data-phone-tab]").forEach(b=>b.classList.toggle("active",b.dataset.phoneTab===tab));document.querySelectorAll(".phone-pane").forEach(p=>p.classList.remove("active"));const target=document.getElementById(`phone${tab.charAt(0).toUpperCase()+tab.slice(1)}Pane`);if(target)target.classList.add("active")}
function callNPC(id){
  const n=getNPC(id);
  if(!n)return;
  if(!npcUnlocked(n)&&!state.unlockedNPCs.includes(n.id))return fail(`You do not know ${n.name} well enough to call yet.`);
  if(!hasTime(15,"a phone call"))return;
  spendTime(15,"a phone call");
  const rep=state.npcRep[id]||0;
  changeRelationship(id,1,"phone call");
  state.knowledge+=1;
  addLog(`📞 You call ${n.name}. Reputation with ${n.name}: ${state.npcRep[id]>=0?"+":""}${state.npcRep[id]}.`);
  checkUnlocks();
  render();
}

function renderPhone(){
  const badge=document.querySelector("#phoneBadge");
  const now=totalMinutes();
  const urgent=(CONTRACTS.concat(state.randomContracts||[])).filter(c=>contractUnlocked(c)&&state.acceptedContracts?.[c.id]&&c.expiresAt!=null&&c.expiresAt-now<=180&&c.expiresAt-now>0).length;
  const unread=Math.min(9,(state.dailyLog||[]).length+urgent+(state.activeEvent?1:0));
  if(badge)badge.textContent=unread?String(unread):"";
  const eventEl=document.querySelector("#phoneCurrentEvent");
  if(eventEl){
    if(state.activeEvent){
      const e=EVENTS.find(x=>x.id===state.activeEvent);
      eventEl.innerHTML=e?`<div class="phone-event"><strong>${escapeHtml(e.icon||"⚡")} ${escapeHtml(e.name)}</strong><span>${escapeHtml(e.description)}</span></div>`:`<div class="phone-event"><strong>🎂 Birthday</strong><span>A special birthday day is active.</span></div>`;
    }else eventEl.innerHTML='<div class="phone-empty">No active event. The city is quiet for the moment.</div>';
  }
  const feed=document.querySelector("#phoneNotifications");
  if(feed){const rows=(state.dailyLog||[]).slice(0,6);feed.innerHTML=rows.length?rows.map(x=>`<div class="phone-feed-item"><small>${escapeHtml(x.time)} • Day ${x.day}</small>${escapeHtml(x.text)}</div>`).join(""):"<div class='phone-empty'>No notifications yet.</div>"}
  const uc=document.querySelector("#phoneUrgentContracts");
  if(uc){const list=(CONTRACTS.concat(state.randomContracts||[])).filter(c=>contractUnlocked(c)&&state.acceptedContracts?.[c.id]&&c.expiresAt!=null&&c.expiresAt-now>0&&c.expiresAt-now<=180).sort((a,b)=>a.expiresAt-b.expiresAt);uc.innerHTML=list.length?list.map(c=>`<div class="phone-feed-item urgent"><small>⏱ ${formatDuration(c.expiresAt-now)} left</small><strong>${escapeHtml(c.name)}</strong><br>${escapeHtml(c.description)}</div>`).join(""):"<div class='phone-empty'>No urgent accepted runs.</div>"}
  const news=document.querySelector("#phoneNews");
  if(news){const rows=state.dailyNews||[];news.innerHTML=rows.length?rows.map((n,i)=>`<div class="phone-feed-item"><small>${i===0?"LEAD":"CITY"}</small>${escapeHtml(n)}</div>`).join(""):"<div class='phone-empty'>No edition available.</div>"}
}

/* Keep the existing renderers, but place their output in the new utility surfaces. */
function throwItem(id){const g=GOODS[id];const owned=state.inventory[id]||0;if(!g||owned<=0)return;const q=Number(prompt(`How many ${g.name} do you want to throw away? (1-${owned})`,String(Math.min(1,owned))));if(!Number.isInteger(q)||q<1||q>owned)return toast("Invalid quantity.");devSnapshot();state.inventory[id]-=q;if(id==="food")state.food=state.inventory.food;addLog(`You throw away ${q} ${g.name}.`);render();}
function renderInventory(){
  const cap=document.querySelector("#backpackCapacity");
  if(cap)cap.textContent=`${materialCount()} / ${storageCapacity()} material slots • ${state.food} food • ${state.energy}% energy`;
  const c=document.querySelector("#inventory");
  if(!c)return;
  const owned=Object.entries(GOODS).filter(([id])=>(state.inventory[id]||0)>0);
  c.innerHTML=owned.length?owned.map(([id,g])=>`<div class="inventory-item"><span><strong>${escapeHtml(g.name)}</strong><small>${escapeHtml(g.description)}</small></span><div class="inventory-item-actions"><strong>${state.inventory[id]}</strong><button class="throw-btn" data-throw-item="${id}" title="Throw away item">🗑 Throw</button></div></div>`).join(""):"<div class='empty-state'>🎒 Your backpack is empty.</div>";
  c.querySelectorAll("[data-use-item]").forEach(b=>b.onclick=()=>{if(!hasTime(10,"using an item"))return;useConsumable(b.dataset.useItem);spendTime(10,"using an item");render()});c.querySelectorAll("[data-throw-item]").forEach(b=>b.onclick=()=>throwItem(b.dataset.throwItem));
}
function renderCharacter(){
  const d=getDistrict(),groups=[
    ["Character",[["Location",d.name],["Date",dateText()],["Time",timeText(state.timeMinutes)],["Corporate Rep",state.corporateSyndicateRep],["Scavenger Rep",state.scavengerRep],["Knowledge",state.knowledge],["Operation Rank",`${getCurrentUpgrade("operation").name} • ${getLevel("operation")}/3`]]],
    ["Materials",Object.entries(GOODS).filter(([id])=>(state.inventory[id]||0)>0).map(([id,g])=>[g.name,state.inventory[id]])],
    ["Properties",[["Housing",state.housingTier],["Transport",getCurrentUpgrade("vehicle").name],["Owned Establishments",state.ownedEstablishments.length],["Private Vehicle",state.usePrivateVehicle?"Yes":"No"]]]
  ];
  const c=document.querySelector("#character");if(!c)return;
  c.innerHTML=groups.map(([title,vals])=>`<div class="character-group"><div class="group-title">${escapeHtml(title)}</div><div class="character-grid-inner">${vals.length?vals.map(([l,x])=>`<div class="kv"><div class="label">${escapeHtml(l)}</div><div class="value">${escapeHtml(String(x))}</div></div>`).join(""):"<div class='empty-state'>None</div>"}</div></div>`).join("");
}
function renderContacts(){
  const c=document.querySelector("#contacts");if(!c)return;
  const sorted=[...NPCS].sort((a,b)=>{const ua=npcUnlocked(a)||state.unlockedNPCs.includes(a.id),ub=npcUnlocked(b)||state.unlockedNPCs.includes(b.id);return Number(ub)-Number(ua)});
  c.innerHTML=sorted.map(n=>{const unlocked=npcUnlocked(n)||state.unlockedNPCs.includes(n.id),rep=state.npcRep[n.id]||0,activity=state.npcActivity?.[n.id];return `<div class="contact-card ${unlocked?"":"locked-card"}"><div><strong>${unlocked?escapeHtml(n.name):"Unknown Contact"}</strong><span>${unlocked?escapeHtml(n.role):"Locked contact"}</span><small>${unlocked?`Rep ${rep>=0?"+":""}${rep} • Knowledge ${state.knowledge}`:`Requires ${escapeHtml(n.unlock?.label||"another contact")}`}</small>${unlocked&&activity?`<small>${activity.available?"● Available":`● ${escapeHtml(activity.note)}`}</small>`:""}</div>${unlocked?`<button class="small-btn" data-phone-talk="${n.id}" ${activity&&!activity.available?"disabled":""}>📞 Call</button>`:"<span class='badge'>🔒</span>"}</div>`}).join("");
  c.querySelectorAll("[data-phone-talk]").forEach(b=>b.onclick=()=>callNPC(b.dataset.phoneTalk));
}

function renderCalendar(){
  const c=document.querySelector("#calendar");
  if(!c)return;
  const start=calendarDate();
  const rows=[];
  for(let i=0;i<14;i++){
    const d=new Date(start); d.setDate(d.getDate()+i);
    const key=`${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,"0")}-${String(d.getDate()).padStart(2,"0")}`;
    const isToday=i===0;
    const birthday=d.getMonth()===new Date(`${state.startDate||"2026-09-24"}T00:00:00`).getMonth()&&d.getDate()===new Date(`${state.startDate||"2026-09-24"}T00:00:00`).getDate()&&state.day>1;
    const news=(state.dailyNews||[]).find(n=>String(n).includes(key));
    rows.push(`<div class="calendar-day ${isToday?"today":""}"><div><strong>${d.toLocaleDateString("en-PH",{weekday:"short",month:"short",day:"numeric"})}</strong>${isToday?`<span class="calendar-tag">TODAY</span>`:""}</div><small>${birthday?"🎂 Birthday returns":(news?"📰 City news recorded":"No fixed event")}</small></div>`);
  }
  c.innerHTML=`<div class="calendar-summary"><strong>${escapeHtml(dateText())}</strong><span>Day ${state.day} • ${escapeHtml(timeText(state.timeMinutes))}</span></div><div class="calendar-list">${rows.join("")}</div>`;
}

/* Local market: only the district the player currently occupies. */
function renderLocalMarket(){
  const c=document.querySelector("#localMarket");
  if(!c)return;
  const view=state.currentDistrict;
  const b=marketBusinessForDistrict(view);
  const stock=b&&SHOP_STOCKS[b.id]?ensureShopStock(b.id):null;
  const d=getDistrict();
  const search=String(state.localMarketSearch||"").trim().toLowerCase();
  const sort=state.localMarketSort||"default";

  const rows=Object.entries(GOODS).map(([id,g])=>{
    const m=state.marketMultiplier[id]||1;
    const condition=marketCondition(m);
    const signal=marketSignal(m);
    const buy=Math.round(g.basePrice*m*(b?b.buyMultiplier:1)*DEV_CONFIG.economy.globalPriceMultiplier*100)/100;
    const sell=Math.round(g.basePrice*m*(b?b.sellMultiplier:1)*DEV_CONFIG.economy.globalPriceMultiplier*DEV_CONFIG.economy.sellPriceMultiplier*100)/100;
    const owned=state.inventory[id]||0;
    const demand=clamp(Math.round((m-.65)/.85*100),0,100), supply=100-demand;
    return {id,g,m,condition,signal,buy,sell,owned,demand,supply,stock:stock?(stock[id]||0):null};
  }).filter(x=>!search || `${x.g.name} ${x.g.description} ${x.condition} ${x.signal.label}`.toLowerCase().includes(search));

  const compare=(a,b)=>{
    switch(sort){
      case "name-asc": return a.g.name.localeCompare(b.g.name);
      case "name-desc": return b.g.name.localeCompare(a.g.name);
      case "buy-low": return a.buy-b.buy || a.g.name.localeCompare(b.g.name);
      case "buy-high": return b.buy-a.buy || a.g.name.localeCompare(b.g.name);
      case "sell-high": return b.sell-a.sell || a.g.name.localeCompare(b.g.name);
      case "sell-low": return a.sell-b.sell || a.g.name.localeCompare(b.g.name);
      case "demand-high": return b.demand-a.demand || a.g.name.localeCompare(b.g.name);
      case "supply-high": return b.supply-a.supply || a.g.name.localeCompare(b.g.name);
      case "owned-high": return b.owned-a.owned || a.g.name.localeCompare(b.g.name);
      default: return 0;
    }
  };
  rows.sort(compare);

  c.innerHTML=`
    <div class="market-summary local-market-summary">
      <div><span class="muted">YOU ARE HERE</span><strong>${escapeHtml(d.name)}</strong></div>
      <div><span class="muted">PRIMARY MARKET</span><strong>${escapeHtml(b?b.name:"Independent Trading")}</strong></div>
      <span class="market-live">● LIVE LOCAL PRICES</span>
    </div>
    <div class="market-note">This is the market you can physically trade in now. Use the Phone → Market Compare tab to browse other districts before travelling.</div>
    <div class="local-market-tools">
      <label class="local-market-search"><span>🔎</span><input id="localMarketSearch" type="search" autocomplete="off" placeholder="Search materials, food, tools..." value="${escapeHtml(state.localMarketSearch||"")}"></label>
      <label class="local-market-sort"><span>Sort by</span><select id="localMarketSort">
        <option value="default" ${sort==="default"?"selected":""}>Default market order</option>
        <option value="name-asc" ${sort==="name-asc"?"selected":""}>Name A → Z</option>
        <option value="name-desc" ${sort==="name-desc"?"selected":""}>Name Z → A</option>
        <option value="buy-low" ${sort==="buy-low"?"selected":""}>Buy price: low → high</option>
        <option value="buy-high" ${sort==="buy-high"?"selected":""}>Buy price: high → low</option>
        <option value="sell-high" ${sort==="sell-high"?"selected":""}>Sell price: high → low</option>
        <option value="sell-low" ${sort==="sell-low"?"selected":""}>Sell price: low → high</option>
        <option value="demand-high" ${sort==="demand-high"?"selected":""}>Demand: high → low</option>
        <option value="supply-high" ${sort==="supply-high"?"selected":""}>Supply: high → low</option>
        <option value="owned-high" ${sort==="owned-high"?"selected":""}>Owned: high → low</option>
      </select></label>
      <span class="local-market-count">${rows.length} of ${Object.keys(GOODS).length} goods</span>
    </div>
    <div class="market-grid">
      ${rows.length?rows.map(({id,g,m,condition,signal,buy,sell,owned,demand,supply,stock})=>`<div class="good-card local-good-card">
        <div class="good-header"><div><strong>${escapeHtml(g.name)}</strong><span>Market good</span></div><span class="owned">Owned: ${owned}${stock!==null?` • Shop: ${stock}`:""}</span></div>
        <p>${escapeHtml(g.description)}</p>
        <span class="market-condition">${condition} <em class="market-signal ${signal.cls}">${signal.icon} ${signal.label}</em></span>
        <div class="market-bars"><div class="market-bar-row"><span>Supply</span><div class="market-bar"><div class="market-bar-fill" style="width:${supply}%"></div></div><strong>${supply}</strong></div><div class="market-bar-row"><span>Demand</span><div class="market-bar"><div class="market-bar-fill" style="width:${demand}%"></div></div><strong>${demand}</strong></div></div>
        <div class="price-row"><div><span class="price-label">BUY</span><strong>${formatMoney(buy)}</strong></div><div><span class="price-label">SELL</span><strong>${formatMoney(sell)}</strong></div></div>
        <div class="market-buttons"><button class="market-button" data-local-market-buy="${id}">🛒 Buy 1</button><button class="market-button" data-local-market-sell="${id}" ${owned<=0?"disabled":""}>💰 Sell 1</button></div>
      </div>`).join(""):`<div class="empty-state market-filter-empty"><strong>No goods match your search.</strong><small>Try a different material name or reset the search.</small><button class="small-btn" id="clearLocalMarketSearch">Clear search</button></div>`}
    </div>`;

  const searchInput=document.querySelector("#localMarketSearch");
  if(searchInput){
    searchInput.oninput=e=>{state.localMarketSearch=e.target.value;renderLocalMarket();const next=document.querySelector("#localMarketSearch");if(next){next.focus();next.setSelectionRange(next.value.length,next.value.length);}};
  }
  const sortSelect=document.querySelector("#localMarketSort");
  if(sortSelect)sortSelect.onchange=e=>{state.localMarketSort=e.target.value;renderLocalMarket();};
  const clear=document.querySelector("#clearLocalMarketSearch");
  if(clear)clear.onclick=()=>{state.localMarketSearch="";renderLocalMarket();};
  c.querySelectorAll("[data-local-market-buy]").forEach(x=>x.onclick=()=>tradeGoodAtDistrict(x.dataset.localMarketBuy,1,"buy",view));
  c.querySelectorAll("[data-local-market-sell]").forEach(x=>x.onclick=()=>tradeGoodAtDistrict(x.dataset.localMarketSell,1,"sell",view));
}

/* Phone market browser: current district first, with remote district comparison. */
function renderMarket(){
  const c=document.querySelector("#market");if(!c)return;
  const view=state.marketViewDistrict||state.currentDistrict,b=marketBusinessForDistrict(view),canTrade=view===state.currentDistrict,stock=b&&SHOP_STOCKS[b.id]?ensureShopStock(b.id):null;
  c.innerHTML=`<div class="market-summary"><div><span class="muted">MARKET COMPARE</span><strong>${escapeHtml(getDistrictName(view))}</strong></div><div><span class="muted">PRIMARY SHOP</span><strong>${escapeHtml(b?b.name:"Independent Trading")}</strong></div><label class="market-select-label">Browse <select id="marketDistrictSelect" class="market-select">${DISTRICTS.map(d=>`<option value="${d.id}" ${d.id===view?"selected":""}>${escapeHtml(d.name)}</option>`).join("")}</select></label></div><div class="market-note">${canTrade?"You are here — buying and selling are enabled.":"Browse-only comparison. Prices update with the city's time and market."}</div><div class="market-grid">${Object.entries(GOODS).map(([id,g])=>{const m=marketMultiplierFor(id,state.currentDistrict),condition=marketCondition(m),buy=Math.round(g.basePrice*m*(b?b.buyMultiplier:1)*DEV_CONFIG.economy.globalPriceMultiplier*100)/100,sell=Math.round(g.basePrice*m*(b?b.sellMultiplier:1)*DEV_CONFIG.economy.globalPriceMultiplier*DEV_CONFIG.economy.sellPriceMultiplier*100)/100,owned=state.inventory[id],demand=clamp(Math.round((m-.65)/.85*100),0,100),supply=100-demand;return `<div class="good-card"><div class="good-header"><div><strong>${escapeHtml(g.name)}</strong><span>Market good</span></div><span class="owned">Owned: ${owned}${stock?` • Shop stock: ${stock[id]||0}`:""}</span></div><p>${escapeHtml(g.description)}</p><span class="market-condition">${condition} <em class="market-signal ${marketSignal(m).cls}">${marketSignal(m).icon} ${marketSignal(m).label}</em></span><div class="market-bars"><div class="market-bar-row"><span>Supply</span><div class="market-bar"><div class="market-bar-fill" style="width:${supply}%"></div></div><strong>${supply}</strong></div><div class="market-bar-row"><span>Demand</span><div class="market-bar"><div class="market-bar-fill" style="width:${demand}%"></div></div><strong>${demand}</strong></div></div><div class="price-row"><div><span class="price-label">BUY</span><strong>${formatMoney(buy)}</strong></div><div><span class="price-label">SELL</span><strong>${formatMoney(sell)}</strong></div></div><div class="market-buttons"><button class="market-button" data-market-buy="${id}" ${canTrade?"":"disabled"}>🛒 Buy 1</button><button class="market-button" data-market-sell="${id}" ${!canTrade||owned<=0?"disabled":""}>💰 Sell 1</button></div></div>`}).join("")}</div>`;
  const sel=document.querySelector("#marketDistrictSelect");if(sel)sel.onchange=e=>setMarketView(e.target.value);
  c.querySelectorAll("[data-market-buy]").forEach(x=>x.onclick=()=>tradeGoodAtDistrict(x.dataset.marketBuy,1,"buy",view));c.querySelectorAll("[data-market-sell]").forEach(x=>x.onclick=()=>tradeGoodAtDistrict(x.dataset.marketSell,1,"sell",view));
}

function render(){renderStats();renderActions();renderNews();renderUpgrades();renderSituation();renderDistricts();renderLocalMarket();renderBusinesses();renderContacts();renderContracts();renderEstablishments();renderAuction();renderInventory();renderCharacter();renderMarket();renderCalendar();renderLog();renderUnlocks();renderEvent();renderPhone();renderDevValues()}

/* Utility button wiring */
document.querySelector("#backpackBtn")?.addEventListener("click",openBackpack);
document.querySelector("#profileBtn")?.addEventListener("click",openProfile);
document.querySelector("#phoneBtn")?.addEventListener("click",()=>openPhone("contacts"));
document.querySelector("#backpackCard")?.addEventListener("click",openBackpack);
document.querySelector("#profileCard")?.addEventListener("click",openProfile);
document.querySelector("#phoneCard")?.addEventListener("click",()=>openPhone("contacts"));
document.querySelector("#phoneHintBtn")?.addEventListener("click",()=>openPhone("contacts"));
document.querySelector("#systemSettingsBtn")?.addEventListener("click",()=>{const m=document.querySelector("#systemMenu");if(m)m.hidden=!m.hidden});
document.querySelector("#systemCloseBtn")?.addEventListener("click",()=>{const m=document.querySelector("#systemMenu");if(m)m.hidden=true});
document.addEventListener("click",e=>{const wrap=document.querySelector(".system-control");const m=document.querySelector("#systemMenu");if(m&&!m.hidden&&wrap&&!wrap.contains(e.target))m.hidden=true});
document.querySelector("#devDockBtn")?.addEventListener("click",()=>{const m=document.querySelector("#systemMenu");if(m)m.hidden=true;openDev()});
document.querySelectorAll("[data-close-modal]").forEach(b=>b.addEventListener("click",()=>closeModal(b.dataset.closeModal)));
document.querySelectorAll("[data-phone-tab]").forEach(b=>b.addEventListener("click",()=>{setPhoneTab(b.dataset.phoneTab);renderPhone()}));
["backpackModal","profileModal","phoneModal"].forEach(id=>document.getElementById(id)?.addEventListener("click",e=>{if(e.target.id===id)closeModal(id)}));
