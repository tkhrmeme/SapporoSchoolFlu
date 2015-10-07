var svgWidth = 800, svgHeight = 700;
var initialMapScale = 70000;
var initialMapCenter = [141.32, 42.98];

var DayIncrement = 1;
var DayDecrement = -1;

var projection;
var path_elm_school;
var path_jrh_shcool;
var path_subway;
var gradColor;

var svg;
var features;

var tooltip;
var zoom;

var csvData;
var infulsData;
var numOfElmSchool;
var numOfJhSchool;
var dateFileList;
var dateIndex = 0;

var viewDate;
var dateFormat = d3.time.format("%Y/%m/%d");

var url_ElementarySchool = "_json/elm_school_area.topojson"
var url_Railway = "_json/railway.topojson"

var DEBUG = 1;
//
url_ElementarySchool = "_json/SapporoElementarySchool.topojson"

function initialize() 
{
	svg = d3.select("#flu_map").append("svg")
			.attr("width", svgWidth)
			.attr("height", svgHeight);
	
	features = svg.append("g");

	gradColor = d3.scale.linear()
		.domain([0, 250])
		.range(["#ffcccc", "#FF0000"]);

	projection = d3.geo.mercator()
			.center(initialMapCenter)
			.translate([svgWidth / 2, svgHeight / 2])
			.scale(initialMapScale);
	
	loadSchoolAreaData();
	loadSubwayData();

	initHtmlElements();
	initBehavior();

	d3.csv("DateFileList.csv", function(error, data) {
		dateFileList = data;

		viewDate = new Date( dateFileList[dateIndex].Date);
		
		d3.select("#viewDate").text(dateFormat(viewDate));

		loadInfulsData(dateFileList[dateIndex].File);
	});
}

function loadSubwayData()
{
	d3.json(url_Railway, function(error, data) {
		var railway = topojson.object(data, data.objects.railway);

		path_railway= d3.geo.path().projection(projection);

		features.selectAll(".railway")
			.data(railway.geometries)
			.enter()
			.append("path")
				.attr("class", function(d) {
					return "railway " +d.properties['line'];} )
				.attr("d", path_railway)
	});
}

// topojsonデータの読み込み。
function loadSchoolAreaData()
{
	d3.json(url_ElementarySchool, function(error, data) {
		var school = topojson.object(data, data.objects.schoolArea);

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
function aggregateInfuls(data)
{
	var aggData = {};

	data.forEach(function(value, index, arr){
		var start = value.Start;
		var finish = value.End; finish.setHours(23,59);
		if((start <= viewDate) && (viewDate <= finish)) {
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
function loadInfulsData(dayNumber)
{
	var file = "_csv/infuls"+dayNumber+".csv";

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
			if(data) {
				csvData = data;	//CSVデータ

				var infulsData = aggregateInfuls(csvData);	// 学校毎に在籍数を集計する

				numOfElmSchool = 0;
				numOfJhSchool = 0;
				
				var schoolList = Object.keys(infulsData);
				schoolList.forEach(function(value) {
					var n = value.length;
					 if(value.substring(n-3) == '小学校') {
						numOfElmSchool++;
					 } else {
					 	numOfJhSchool++;
					 }
				});
				d3.select('#NumOfSchool').text("        学校数 "+numOfElmSchool);

				d3.selectAll(".school")
					.on("mouseover", function(d) {tooltip.style("visibility","visible");})
					.on("mouseout", function(d) {tooltip.style("visibility","hidden");})
					.on("mousemove", function(d) {
						if(infulsData.hasOwnProperty(d.id)) {
							var content = d.id +' ' +infulsData[d.id] +" 名";
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
						if(infulsData.hasOwnProperty(d.id)) {
							return gradColor(infulsData[d.id])
						}
					});
			}
		}
	);
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

//日付を前後に変更する
function changeDay(dayInc)
{
	var newIndex = dateIndex - dayInc;

	if (DEBUG) {
		console.log("changeDay" +dayInc);
	}
	
	if((newIndex >= 0) & (newIndex < dateFileList.length)) {
		dateIndex = newIndex;

		viewDate = new Date(dateFileList[dateIndex].Date);

		d3.select("#viewDate").text(dateFormat(viewDate));

		loadInfulsData(dateFileList[dateIndex].File);
	}
}

function initHtmlElements()
{
	tooltip = d3.select("body")
		.append("div")
		.attr("class", "tooltip")
		.style("position","absolute")
		.style("z-index","10")
		.style("visibility","hidden");

	$("#prev_day_button").mousedown(function(d) {
		changeDay(DayDecrement);
	});
	$("#next_day_button").mousedown(function(d) {
		changeDay(DayIncrement);
	});
}

