let gcodeCheck = [
  "G0", "G1", "G2", "G3", "G4", "G5", "G10", "G11", "G17", "G18", "G19", "G20", "G21", "G26", "G27", "G28", "G29", "G30", "G31", "G32", "G33", "G34", "G35", "G38.2", "G38.3", "G38.4", "G38.5", "G42", "G53", "G54", "G55", "G56", "G57", "G58", "G59", "G60", "G61", "G76", "G80", "G90", "G91", "G92",
  "M0", "M1", "M3", "M4", "M5", "M17", "M18", "M20", "M21", "M22", "M23", "M24", "M25", "M26", "M27", "M28", "M29", "M30", "M31", "M32", "M33", "M34", "M35", "M36", "M37", "M38", "M39", "M40", "M41", "M42", "M43", "M48", "M73", "M75", "M76", "M77", "M78", "M80", "M81", "M82", "M83", "M84", "M85", "M92", "M100", "M104", "M105", "M106", "M107", "M108", "M109", "M110", "M111", "M112", "M113", "M114", "M115", "M117", "M118", "M119", "M120", "M121", "M122", "M125", "M126", "M127", "M128", "M129", "M140", "M141", "M142", "M143", "M144", "M145", "M149", "M150", "M155", "M163", "M164", "M165", "M166", "M190", "M200", "M201", "M203", "M204", "M205", "M206", "M207", "M208", "M209", "M211", "M217", "M218", "M220", "M221", "M226", "M240", "M250", "M260", "M261", "M280", "M281", "M282", "M283", "M290", "M300", "M301", "M302", "M303", "M304", "M305", "M306", "M350", "M351", "M355", "M360", "M361", "M362", "M363", "M364", "M365", "M380", "M381", "M400", "M401", "M402", "M403", "M404", "M405", "M406", "M407", "M408", "M420", "M421", "M422", "M423", "M428", "M430", "M486", "M500", "M501", "M502", "M503", "M504", "M505", "M524", "M540", "M569", "M575", "M600", "M603", "M605", "M665", "M666", "M667", "M668", "M669", "M672", "M673", "M701", "M702", "M703", "M710", "M851", "M852", "M853", "M860", "M861", "M862", "M900", "M906", "M907", "M908", "M909", "M910", "M911", "M912", "M913", "M914", "M915", "M916", "M917", "M918", "M919", "M920", "M921", "M922", "M923", "M924", "M925", "M997", "M999",
  "T0", "T1", "T2", "T3", "T4", "T5", "T6", "T7", "T8", "T9"
];

let initX = 0;
let initY = 0;
let initZ = 0;

let nozzleTemp = 0;
let bedTemp = 0;

let keyInterval;
let keyIntervalRunning = false;

const Xc = 110; // absolute positioning for center line
const ytot = 150;
const Zpen = 10;

function setup() {
  createCanvas(windowWidth, windowHeight, WEBGL);
  fab = createFab();

  loadLocalData();

  const dataInputs = document.querySelectorAll("input");
  dataInputs.forEach(i => {
    i.addEventListener("change", () => {
      storeLocalData();
    });
  });

  document.querySelector("#start-btn").addEventListener("click", () => {
    getInitPosition();
    getInitTemps();
    fab.commands = [
      "G90",
      "M83",
      "G28",
      "G21",
      "M84 S0",
      "G92 E0",
      "M302 P1",
      `G0 X${initX} Y${initY} Z${initZ} F1500`
    ];
    fab.print();
    pushMessage("printing started", "green");
  });

  document.querySelector("#stop-btn").addEventListener("click", () => {
    fab.commands = [];
    fab.stopPrint();
    pushMessage("printing stopped", "orange");
  });

  document.querySelector("#heat-btn").addEventListener("click", () => {
    if (fab.isPrinting) {
      getInitTemps();
      fab.commands = [
        `M104 S${nozzleTemp}`,
        `M140 S${bedTemp}`
      ];
      fab.print();
      pushMessage("heating nozzle/bed", "magenta");
    } else {
      pushMessage("initialize printer first", "red");
    }
  });

  document.querySelector("#cool-btn").addEventListener("click", () => {
    if (fab.isPrinting) {
      getInitTemps();
      fab.commands = [
        `M104 S0`,
        `M140 S0`
      ];
      fab.print();
      pushMessage("cooling nozzle/bed", "blue");
    } else {
      pushMessage("initialize printer first", "red");
    }
  });

  document.querySelector("#cold-extrusion").addEventListener("change", () => {
    if (fab.isPrinting) {
      if (document.querySelector("#cold-extrusion").checked) {
        fab.commands = [`M302 P1`];
        fab.print();
        pushMessage("cold extrusion enabled", "blue");
      } else {
        fab.commands = [`M302 P0`];
        fab.print();
      }
    } else {
      pushMessage("initialize printer first", "red");
      document.querySelector("#cold-extrusion").checked = false;
    }
  });

  document.querySelector("#fan-on").addEventListener("change", () => {
    if (fab.isPrinting) {
      if (document.querySelector("#fan-on").checked) {
        let fanSpeed = document.querySelector("#fan-speed").value;
        fanSpeed = fanSpeed > 255 ? 255 : fanSpeed < 0 ? 0 : Math.floor(fanSpeed);
        console.log(`fan speed: ${fanSpeed}`);
        fab.commands = [`M106 S${fanSpeed}`];
        fab.print();
        pushMessage("fan on", "blue");
      } else {
        console.log(`fan off`);
        fab.commands = [`M106 S0`];
        fab.print();
        pushMessage("fan off", "blue");
      }
    } else {
      pushMessage("initialize printer first", "red");
      document.querySelector("#fan-on").checked = false;
    }
  });
}

function draw() {
  if (fab.isPrinting) {
    console.log(fab.commands);
    document.querySelector("#start-btn").classList.add("active");
    if (fab.commands.length === 0) {
      pushMessage("awaiting gcode", "#999", true);
    }
  } else {
    document.querySelector("#start-btn").classList.remove("active");
    getInitPosition();
  }
}

function getInitPosition() {
  initX = Xc;
  initY = 0;
  initZ = Zpen;
}

function getInitTemps() {
  nozzleTemp = document.querySelector("#nozzle-temp").value;
  bedTemp = document.querySelector("#bed-temp").value;
}

function storeLocalData() {
  let data = {};
  const dataInputs = document.querySelectorAll("input");
  dataInputs.forEach(i => {
    if (i.id) {
      data[i.id] = i.value;
    }
  });
  localStorage.setItem("localData", JSON.stringify(data));
}

function loadLocalData() {
  const dataString = localStorage.getItem("localData");
  if (dataString) {
    const data = JSON.parse(dataString);
    for (const key in data) {
      const ele = document.querySelector(`#${key}`);
      if (ele) {
        ele.value = data[key];
      }
    }
    pushMessage("data loaded from local storage", "black");
  } else {
    pushMessage("no local data", "black");
  }
}

let previousMessage = "";
function pushMessage(msg, color, check = false) {
  const now = new Date();
  const hours = now.getHours() + "";
  const minutes = now.getMinutes() + "";
  const seconds = now.getSeconds() + "";

  if (msg === previousMessage && check) {
    document.querySelector("#message-container li").innerHTML = `[${hours.padStart(2, "0")}:${minutes.padStart(2, "0")}:${seconds.padStart(2, "0")}] ${msg}`;
  } else {
    const li = document.createElement("li");
    li.textContent = `[${hours.padStart(2, "0")}:${minutes.padStart(2, "0")}:${seconds.padStart(2, "0")}] ${msg}`;
    li.style.color = color;
    document.querySelector("#message-container").prepend(li);
    previousMessage = msg;
  }
}

function clearMsg() {
  document.querySelector("#message-container").innerHTML = "";
}

function checkGcode(_gcode) {
  let _g = _gcode.trim();
  if (gcodeCheck.includes(_g.split(" ")[0])) {
    return _g;
  } else {
    pushMessage(`invalid gcode: "${_gcode}"`, "red");
    return "";
  }
}

document.querySelector("#axes-btn").addEventListener("click", () => {
  const rawaxessequence = 
`G0 X${Xc - 90} Y60 Z${Zpen + 3} F2000
G0 Z${Zpen} F2000
G0 X${Xc - 85} Y65 F2000
G0 Z${Zpen + 3} F2000
G0 Y55 F2000
G0 Z${Zpen} F2000
G0 X${Xc - 90} Y60 F2000
G0 X${Xc + 90} F2000
G0 Z${Zpen + 3} F2000
G0 X${Xc} F2000
G0 Z${Zpen} F2000
G0 Y${ytot + 70} F2000
G0 X${Xc - 5} Y${ytot + 65} F2000
G0 Z${Zpen + 3} F2000
G0 X${Xc + 5} F2000
G0 Z${Zpen} F2000
G0 X${Xc} Y${ytot + 70} F2000
G0 Z${Zpen + 3} F2000
G0 X${Xc} Y60 F2000`;

  if (fab.isPrinting) {
    fab.commands = rawaxessequence
      .split("\n")
      .map(line => checkGcode(line.trim()));

    fab.print();
    pushMessage("sent axes sequence", "blue");
  } else {
    pushMessage("initialize printer first", "red");
  }
});

document.querySelector("#reset-btn").addEventListener("click", () => {
  const resetsequence = `G90
G0 Z${Zpen + 3} F1000
G0 X${Xc} Y60 F5000`;

  if (fab.isPrinting) {
    fab.commands = resetsequence
      .split("\n")
      .map(line => checkGcode(line.trim()));

    fab.print();
    pushMessage("sent reset sequence", "blue");
  } else {
    pushMessage("initialize printer first", "red");
  }
});

function sy(y, amp, length, midline) {
  return Xc - amp * Math.sin((2 * Math.PI / length) * y) - midline;
}

function cy(y, amp, length, midline) {
  return Xc - amp * Math.cos((2 * Math.PI / length) * y) - midline;
}


function ty(y, amp, length, midline) {
  return Xc - amp * Math.tan((2 * Math.PI / length) * y) - midline;
}

// const gcodedownlist = yvaluesdown
//   .map(y => ({ x: ty(y, 60, 100, 10), y }))
//   .filter(point => point.x >= 20 && point.x <= 200)
//   .map(point => `G0 X${point.x} Y${point.y + 60} F1000`);

  
document.querySelector('#drawgraph-btn').addEventListener("click", function() {
  const A = parseFloat(document.querySelector('#amplitude-input').value) || 60;
  const wlen = parseFloat(document.querySelector('#wavelength-input').value) || 100;
  const D = parseFloat(document.querySelector('#midline-input').value) || 0;

  const yvaluesdown = [];
  for (let i = 0; i <= ytot; i += 2) {
    yvaluesdown.push(i);
  }

  if(document.querySelector('#trigtype').value == "sine") {
    const gcodedownlist = yvaluesdown.map(y => `G0 X${sy(y, A, wlen, D)} Y${y + 60} F1000`)}
    else {
      const gcodedownlist = yvaluesdown.map(y => `G0 X${cy(y, A, wlen, D)} Y${y + 60} F1000`)}


  const sinegraphgcode = `G90\nG0 X${Xc} Y60 F4000\nG0 Z${Zpen} F1000\n` + gcodedownlist.join("\n");

  if (fab.isPrinting) {
    const formattedGcode = sinegraphgcode
      .split("\n")
      .map(line => checkGcode(line));

    fab.commands = formattedGcode;
    fab.print();

    pushMessage("sent custom trig graph sequence", "blue");
  } else {
    pushMessage("initialize printer first", "red");
  }
});

document.querySelector("#penup").addEventListener("click", () => {
  const penupsequence = `G90
G0 Z${Zpen + 3} F1000`

  if (fab.isPrinting) {
    fab.commands = penupsequence
      .split("\n")
      .map(line => checkGcode(line.trim()));

    fab.print();
    pushMessage("sent pen up sequence", "blue");
  } else {
    pushMessage("initialize printer first", "red");
  }
});

document.querySelector("#pendown").addEventListener("click", () => {
  const pendownsequence = `G90
G0 Z${Zpen} F1000`

  if (fab.isPrinting) {
    fab.commands = pendownsequence
      .split("\n")
      .map(line => checkGcode(line.trim()));

    fab.print();
    pushMessage("sent pen down sequence", "blue");
  } else {
    pushMessage("initialize printer first", "red");
  }
});
