var svgWidth = 800, svgHeight = 700;
var initialMapScale = 70000;
var initialMapCenter = [141.32, 42.98];

var DayIncrement = 1;
var DayDecrement = -1;

var projection;
var path_elm_school;
var path_jh_school;
var path_subway;
var gradColor;

var svg;
var features;

var tooltip;
var zoom;

var csvData;

var viewDate;
var dateFormat = d3.time.format("%Y/%m/%d");

//

function initialize() 
{
	svg = d3.select("#flu_map").append("svg")
			.attr("width", svgWidth)
			.attr("height", svgHeight);
	
	features = svg.append("g");

	gradColor = d3.scale.linear()
		.domain([0, 250])
		.range(["#ffcccc", "#FF0000"]);

	loadSubwayData();

	loadSchoolAreaData();

	initHtmlElements();
	initBehavior();

	loadInfulsData("2013");
}

// topojsonデータの読み込み。
function loadSchoolAreaData()
{
	d3.json("json/elm_school_area.topojson", function(error, sapporo) {
		var school = topojson.object(sapporo, sapporo.objects.schoolArea);

		projection = d3.geo.mercator()
				.center(initialMapCenter)
				.translate([svgWidth / 2, svgHeight / 2])
				.scale(initialMapScale);

		path_elm_school = d3.geo.path().projection(projection);

		features.selectAll(".school")
			.data(school.geometries)
			.enter()
			.append("path")
				.attr("class", "school")
				.attr("id", function(d) {return d.id;})
				.attr("d", path_elm_school)
				.attr("stroke", "lime")
				.attr("fill","none");
	});
}

//CSVデータを集計する
function aggregateInfuls(date)
{
	var aggData = {};

	csvData.forEach(function(value, index, arr){
		var start = value.Start;
		var finish = value.End; finish.setHours(23,59);
		if((start <= date) && (date <= finish)) {
			if (aggData.hasOwnProperty(value.School)) {
				aggData[value.School] += value.Count;
			} else {
				aggData[value.School] = value.Count;
			}
		}
	});

	return aggData;
}

//CSVデータを読み込む
function loadInfulsData(yearNumber)
{
	var file = "infuls"+yearNumber+".csv";
	console.log(file);

	d3.csv(file, function(d) {
					return {
						City: d.City,
						School: d.School,
						Address: d.Address,
						Type: d.Type,
						Start: new Date(d.Start),
						End: new Date(d.End),
						Grade: d.Grade,
						Count: +d.Count
					};
				},
		function(error, data) {
			csvData = data;	//CSVデータ

			showDayData(new Date("2014/01/28"));
		}
	);
}

function showDayData(newDate)
{
	viewDate = newDate;

	var dayStr = dateFormat(viewDate);
	d3.select("#viewDate").text(dayStr);

	drawFluMap( aggregateInfuls(viewDate) );
}
function drawFluMap(data)
{
	d3.selectAll(".school")
		.on("mouseover", function(d) {tooltip.style("visibility","visible");})
		.on("mouseout", function(d) {tooltip.style("visibility","hidden");})
		.on("mousemove", function(d) {
			if(data.hasOwnProperty(d.id)) {
				var content = d.id +' ' +data[d.id] +" 名";
				tooltip
					.style("top", (d3.event.pageY-10)+"px")
					.style("left", (d3.event.pageX+10)+"px")
					.html(content);
			}
		})
		.transition()
		.attr("fill", "black") //全部黒く塗る
		.duration(600)
		.attr("fill", function(d) {
			if(data.hasOwnProperty(d.id)) {
				return gradColor(data[d.id])
			}
		});
}

function initBehavior()
{
	zoom = d3.behavior.zoom()
		.scale(1)
		.scaleExtent([1,4])
		.on('zoom', function() {
			features.attr("transform", "translate(" +d3.event.translate +")scale(" +d3.event.scale +")");
		});
	svg.call(zoom);
}

//日付を前後１日単位で変更する
function changeDay(dayInc)
{
	var t = viewDate.getTime();
	t += dayInc * 60 * 60 * 24 *1000;
	showDayData(new Date(t));
}

function initHtmlElements()
{
	tooltip = d3.select("body")
		.append("div")
		.attr("class", "tooltip")
		.style("position","absolute")
		.style("z-index","10")
		.style("visibility","hidden");

	d3.select("#PrevDay")
		.on("click", function(d) {
			changeDay(DayDecrement);
		});

	d3.select("#NextDay")
		.on("click", function(d) {
			changeDay(DayIncrement);
		});
}

