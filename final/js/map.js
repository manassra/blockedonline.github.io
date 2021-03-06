
var svg, worldObject, active; 
var width = 1028, height = 500; 

var projection = d3.geo.equirectangular()
    .scale((width + 1) / 2 / Math.PI)
    .translate([width / 2, height / 2])
    .precision(.1);

var path = d3.geo.path()
    .projection(projection); 

var tip = d3.tip()
  .attr('class', 'd3-tip')
  .html(function(d) {
    return d.properties.name ;
  }); 


var color = d3.scale.pow().exponent(0.5).range(['#FEF0D9', '#D7301F']);

var blockedMap = d3.map();
var terms; 

var maxBlockedPerCountry = -1, currentCallId = null, currentIndex = 0;
var INTERVAL_DELAY = 4000; 

function setupMap(ename, data) {
	svg = d3.select('#'+ename)
		.append('svg')
		.attr('width', width)
		.attr('height', height)
		.append('g');
	svg.call(tip);
  
	data.terms.forEach(function (d, i) {
		blockedMap.set(d.alpha2, parseInt(d.n));
		maxBlockedPerCountry = Math.max(maxBlockedPerCountry, parseInt(d.n)); 
	});
  
  terms = d3.shuffle(data.terms.filter(function (d) {return parseInt(d.n) > 0}));
	
	color.domain([0, maxBlockedPerCountry]);
	
	d3.json('http://cdn.blockedonline.com/js/world.geojson', function (world) {
		worldObject = world; 
		createMap();
    createLegend();
	})
}

function createMap() {
	svg.selectAll('.country')
		.data(worldObject.features)
		.enter().append('path')
		.attr('class', 'country')
		.attr('d', path)
		.attr('fill', function (d, i) {
			if (blockedMap.has(d.id)) {
				return color(blockedMap.get(d.id));
			} 
			return '#CCCCCC';
		})
    .on('click', function (d) {
      clearInterval(currentCallId); 
      $('.news-tip').finish(); 
      var centroid = path.centroid(d);
      if (blockedMap.has(d.id)) { 
				$('.news-tip #count').text(blockedMap.get(d.id));
				$('.news-tip #name').text(d.properties.name);
        $('.news-tip .tip-content').show(); 
        $('.news-tip .tip-content-no-info').hide();  
      } else {
        $('.news-tip .tip-content').hide(); 
        $('.news-tip .tip-content-no-info').show();  
      }
			$('.news-tip').css({
				left: centroid[0] + $(svg.node()).offset().left - $('.news-tip').width()/2.0 + 10 ,
				top: centroid[1] + $(svg.node()).offset().top - $('.news-tip').height() - 25,
        opacity: 1.0
			});
			$('.news-tip').delay(3000).animate({opacity: 0.0});
			currentCallId = setInterval(showTip, INTERVAL_DELAY);
		})
		.on('mouseover', tip.show)
		.on('mousemove', function (d, i) {
			d3.select('.d3-tip')
			.style('left', (d3.event.pageX + 10)  + 'px')
			.style('top', (d3.event.pageY + 10) + 'px');
		})
		.on('mouseout', tip.hide); 
		
		showTip();
		currentCallId = setInterval(showTip, INTERVAL_DELAY);
}

function createLegend() {
  var g = svg.append('g')
    .attr('class', 'legend')
    .attr('transform', 'translate(10, ' +  (height - 220) + ')'); 
  
  g.selectAll('.legend-rect')
    .data(d3.range(6))
    .enter().append('rect')
    .attr('x', 15)
    .attr('y', function (d, i) {
      if (i == 5) return i * 15 + 5; 
      return i * 15; 
    })
    .attr('width', 15)
    .attr('height', 15)
    .attr('fill', function (d, i) { 
      if (i == 5) return '#ccc';
      return color((5-i) * maxBlockedPerCountry / 4);
    })
    .each(function (d, i) {
      var text = g.append('text')
        .attr('x', 35)
        .attr('y', i * 15 + 12)
        .attr('fill', '#ccc')
      if (i == 0) {
        text.text('Most Censorship')
      } else if (i == 4) {
        text.text('Least Censorship')
      } else if (i == 5) {
        text.text('No Data'); 
        text.attr('y', i*15 + 17)
      } else {
        text.remove();
      }
    })
}

function showTip() {
	var feature = svg.selectAll('.country')
		.filter(function (d, i) { return d.id == terms[currentIndex].alpha2})
		.datum(); 
	var centroid = path.centroid(feature); 
	var svgOffsetLeft = $(svg.node()).offset().left; 
	var svgOffsetTop = $(svg.node()).offset().top; 
	
	$('.news-tip .tip-content-no-info').hide();  
  $('.news-tip .tip-content').show(); 
	
	$('.news-tip #count').text(terms[currentIndex].n);
	$('.news-tip #name').text(feature.properties.name);
	
	$('.news-tip').css({
		left: centroid[0] + svgOffsetLeft - $('.news-tip').width()/2.0 + 10 ,
		top: centroid[1] + svgOffsetTop - 90
	});
	
	$('.news-tip').animate({
			top: centroid[1] + svgOffsetTop - $('.news-tip').height() - 25,
			opacity: 1.0
		})
		.delay(2000)
		.animate({
			opacity: 0.0
		}); 
	currentIndex = (currentIndex + 1) % terms.length; 
}