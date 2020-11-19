// set the dimensions and margins of the graph
var div_width = document.getElementById("my_dataviz").clientWidth;
var div_height = document.getElementById("my_dataviz").clientHeight;
var margin = {top: 150, right: 50, bottom: 50, left: 50},
width = div_width - margin.left - margin.right,
height = div_height - margin.top - margin.bottom;

// append the svg object to the body of the page
var svg = d3.select("#my_dataviz")
.append("svg")
.attr("id", "main-svg")
.attr("viewBox", "0 0 "+ div_width +" "+div_height)
.attr("preserveAspectRatio", "xMinYMin meet")
.style("display", "block")
.append("g")
.attr("transform", "translate(" + margin.left + "," + margin.top + ")");
d3.select("#main").style("height", "100%");
d3.select("#parallel_viz_container").style("height", "100%");

var pupil_viz_width = document.getElementById("pupil_viz").clientWidth;
var pupil_viz_height = document.getElementById("pupil_viz").clientHeight;
var svg_pupil = d3.select("#pupil_viz")
.append("svg")
.attr("id", "pupil-svg")
.attr("viewBox", "0 0 "+ pupil_viz_width +" "+ pupil_viz_height)
.attr("preserveAspectRatio", "xMinYMin meet")
.style("display", "block")

var x, y;
var sliderPressed = false;

//Read the data
var ratData = [];
function sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
}

function fetchCSV(){
    
    var file = selectInput();
    d3.csv(file, function(d) {
        return {
            t : +d.timestamp,
            x : +d.gazepointX,
            y : +d.gazepointY, // new field
            r : +d.duration, // new field
            p : +d.avg_pupil
        };
    }, async function(error, rows) {
        ratData = rows;
        sliderPressed = true;
        await sleep(300);
        clear();
        d3.select('#main-svg').exit();
        svg_pupil.select("*").remove();
        d3.select("#pupil").remove()
        svg.selectAll("*").remove();
        d3.select("#controller").selectAll("input").remove();
        renderMyVisualization();
    });
}

function selectInput()
{
    var participant = document.getElementById("participant").value;
    var treeOrGraph = document.getElementById("treeOrGraph").value;
    console.log("data/".concat(participant,"_",treeOrGraph,".csv"));
    return "data/".concat(participant,"_",treeOrGraph,".csv");
}

function plotAxis(gazePointX, gazePointY) {
    // Add X axis
    x = d3.scaleLinear()
    .domain([0, 1280])
    .range([ 0 , width]);
    svg.append("g")
    .style("font", "7px times")
    .attr("transform", "translate(0," + height + ")")
    .call(d3.axisBottom(x));

    // Add Y axis
    y = d3.scaleLinear()
    .domain([0, 1152])
    .range([ height, 0-100]);
    svg.append("g")
    .style("font", "7px times")
    .attr("transform", "translate(" + 0 + ", 0)")
    .call(d3.axisLeft(y));
}

function plotAll(gazePointX, gazePointY, timestamp, radius){
    var plotData = [];
    for(var j = 0; j<timestamp.length; j++) {
        plotData.push( {t : timestamp[j], x : gazePointX[j], y: gazePointY[j], r: radius[j]} )
    }
    svg.selectAll("dot").raise()
        .data(plotData)
        .enter()
        .append("circle")
        .attr("id", function(d){return "id"+d.t;} )
        .attr("cx", function(d){return x(d.x);} )
        .attr("cy", function(d){return y(d.y);} )
        .attr("r",  function(d){return d.r;} )
        .attr("stroke-width", 0.5)
        .attr("stroke", "black")
        .style("visibility", "hidden")
        .attr("fill", "#B2D4EF");

    for (var index=timestamp.length-1; index>0; index--) {
        svg.append('line').lower()
            .attr("id", "lineId"+timestamp[index])
            .attr("stroke-width", 0.5)
            .style("visibility", "hidden")
            .attr("stroke", "#808080")
            .attr("x1", x(gazePointX[index]))
            .attr("y1", y(gazePointY[index]))
            .attr("x2", x(gazePointX[index-1]))
            .attr("y2", y(gazePointY[index-1]))
    }
}

function scale(arr, minEl, maxEl) {
  const arrMax = Math.max.apply(Math,arr);
  console.log("max = " + arrMax);
  var result = [];
  for (let item of arr) {
    if(item == null) {
     console.log("found");
    }
    result.push(((item/arrMax)*maxEl + minEl));
  }
  return result;
}

function redraw_svg(curr_timestamp, timestamp, gazePointX, gazePointY, radius, avg_pupil){
    var index=0;
    svg.exit();
    for(var j = 0; j<timestamp.length; j++) {
        index=j;
        if(timestamp[j] >= curr_timestamp){
            break;
        }
    }
    svg_pupil.select("#external-eye").attr("visibility", "visible")
    d3.select("#pupil").style("visibility", "visible").attr("r", avg_pupil[index])
    svg.select("#lastPointer").remove()
    svg.selectAll("circle").style("visibility", "visible").filter(function(d, i) {return i >= index;}).style("visibility", "hidden");
    svg.selectAll("line").style("visibility", "visible").filter(function(d, i) {return i >= index;}).style("visibility", "hidden");
    svg.append("circle")
        .attr("id", "lastPointer" )
        .attr("cx", x(gazePointX[index]) )
        .attr("cy", y(gazePointY[index]) )
        .attr("r", radius[index])
        .attr("stroke-width", 2)
        .attr("stroke", "black")
        .style("fill", "#FF0000")
    return index;
}

function clear() {
    svg.exit()
    d3.select("#pupil").style("visibility", "hidden")
    svg.selectAll("*").exit()
    svg.selectAll("circle").style("visibility", "hidden")
    svg.selectAll("line").style("visibility", "hidden")
}

async function renderMyVisualization() {
    var radius = [];
    var gazePointX = [];
    var gazePointY = [];
    var timestamp = [];
    var avg_pupil = [];
    sliderPressed = false;
    for (let item in ratData) {
        if(ratData[item].x != null || ratData[item].y != null || ratData[item].r != null) {
            radius.push(ratData[item].r);
            gazePointX.push(ratData[item].x);
            gazePointY.push(ratData[item].y);
            timestamp.push(ratData[item].t);
            avg_pupil.push(ratData[item].p);
        }
    }
    radius = scale(radius, 5, 10);
    avg_pupil = scale(avg_pupil, Math.min(pupil_viz_height,pupil_viz_width)/150, Math.min(pupil_viz_height,pupil_viz_width)/5);
    plotAxis(gazePointX, gazePointY);
    plotAll(gazePointX, gazePointY, timestamp, radius);
    
    // add a slider
    var slider = d3.select("#controller").append("input")
        .attr("type", "range")
        .attr("min",  Math.min.apply(Math, timestamp))
        .attr("max", Math.max.apply(Math, timestamp))
        .style("width", "100%")
        .attr("value", timestamp[0])
        .on("input", function() { 
            sliderPressed = true;
            d3.select('#main-svg').exit();
            d3.select("#controller").select("input").attr("value", this.value);
            redraw_svg(this.value, timestamp, gazePointX, gazePointY, radius, avg_pupil); // this has the value of the slider
        });
    // add a external eye 
    svg_pupil.append("circle").attr("id", "external-eye")
    .attr("r", Math.min(pupil_viz_height,pupil_viz_width)/2)
    .attr("cx", pupil_viz_width/2 )
    .attr("cy", pupil_viz_height/2 )
    .attr("stroke-width", 2)
    .attr("stroke", "black")
    .attr("fill", "None")
    .attr("visibility", "hidden")

    var pupil = svg_pupil.append("circle")
    .attr("id", "pupil")
    .attr("r", avg_pupil[0])
    .attr("cx", pupil_viz_width/2 )
    .attr("cy", pupil_viz_height/2 )
    .attr("fill", "black")
    .attr("visibility", "hidden")
    
    d3.select("#transition").on("click", async function() {
        sliderPressed = true;
        await sleep(500);
        clear();
        plotAxis(gazePointX, gazePointY);
        sliderPressed = false;
        // add the first dot to start transition
        var circle = svg.append('g')
            .selectAll("dot").raise()
            .data([ratData[0]])
            .enter()
            .append("circle")
            .attr("id", function(d){return "id"+d.t;} )
            .attr("cx", function(d){return x(d.x);} )
            .attr("cy", function(d){return y(d.y);}  )
            .attr("r", 3.0)
            .attr("stroke-width", 2)
            .attr("stroke", "black")
            .style("fill", "#FF0000")
        svg_pupil.select("#external-eye").style("visibility", "visible")
        pupil.style("visibility", "visible")
        var prevT = null;
        var i = 0;
        for (let item of ratData){
            if(sliderPressed){
                break;
            }
            pupil.transition()
                .duration(item.r)
                .attr("r", avg_pupil[i])
            d3.select("#controller").select("input").attr("value", timestamp[i]);
            circle.raise()
                .transition()
                .duration(item.r)
                .attr("cx", function(d) {return x(item.x);})
                .attr("cy", function(d) {return y(item.y);})
                .attr("r", radius[i]);
            await sleep(item.r);
            if(prevT!= null && !sliderPressed) {
                svg.select("#id"+prevT).style("visibility", "visible");
                svg.select("#lineId"+prevT).style("visibility", "visible");
            }
            prevT = item.t;
            i++;
        }
    });

}

