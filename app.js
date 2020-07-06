const remoteUrl =
  "https://raw.githubusercontent.com/freeCodeCamp/ProjectReferenceData/master/global-temperature.json";

// console.log("here")
d3.json(remoteUrl).then((dataset) => {
  // process data first
  const months = [
    "January",
    "February",
    "March",
    "April",
    "May",
    "June",
    "July",
    "August",
    "September",
    "October",
    "November",
    "December",
  ];
  const baseTemp = +dataset.baseTemperature;
  const monthVar = dataset.monthlyVariance;

  // get a list of years for the x axis
  const years = Array.from(new Set(monthVar.map((d) => d.year)));
  // margins, width and height for the svg element
  const margin = { top: 20, right: 60, bottom: 80, left: 80 };
  const width = 1600 - margin.left - margin.right;
  const height = 540 - margin.top - margin.bottom;

  // how tall should the heatmap rectangle cells be?
  const cellH = height / 12;
  const cellW = width / years.length;

  // convert into javascript Dates, get written month
  // and actual temperature = baseTemp + variance
  monthVar.forEach((d) => {
    d.datum = new Date(d.year, d.month - 1, 1, 0, 0, 0);
    d.month = +d.month - 1;
    d.monthStr = months[d.month];
    d.temperature = Math.round((baseTemp + d.variance) * 100) / 100;
  });

  // calculate min and max
  const minYear = d3.min(monthVar, (d) => d.year);
  const maxYear = d3.max(monthVar, (d) => d.year);
  const minTemp = d3.min(monthVar, (d) => d.temperature);
  const maxTemp = d3.max(monthVar, (d) => d.temperature);
  const round = (num) => Math.round(num * 10) / 10;

  // add title and subtitle
  const subTitle =
    minYear + " - " + maxYear + ": Base Temperature " + baseTemp + "&#8451;";
  d3.select("main").append("header");
  d3.select("header")
    .append("h1")
    .attr("id", "title")
    .style("margin", "20px 0 5px 0")
    .text("Monthly Global Land-Surface Temperature");
  d3.select("header")
    .append("h3")
    .attr("id", "description")
    .style("margin", "5px 0 10px 0")
    .html(subTitle);

  // append svg and position relative to main element
  const svg = d3
    .select("main")
    .append("svg")
    .attr("class", "heatmap")
    .attr("width", width + margin.left + margin.right)
    .attr("height", height + margin.top + margin.bottom);

  // add the hidden tooltip div
  const div = d3
    .select("body")
    .append("div")
    .attr("id", "tooltip")
    .style("opacity", 0);

  // create x and y scale and x and y axis
  const xScale = d3.scaleBand().domain(years).range([0, width]).padding(0.01);

  const xAxis = d3
    .axisBottom(xScale)
    .tickValues(years.filter((year) => year % 10 === 0));

  svg
    .append("g")
    .attr("transform", `translate(${margin.left}, ${height + margin.top})`)
    .attr("id", "x-axis")
    .call(xAxis);

  // append the x axis text = Years
  svg
    .append("text")
    .style("text-anchor", "center")
    .attr(
      "transform",
      `translate(${svg.attr("width") / 2}, ${
        svg.attr("height") - margin.bottom / 2.3
      })`
    )
    .text("Years");

  // y axis -> months
  const yScale = d3.scaleBand().domain(months).range([0, height]).padding(0.01);

  const yAxis = d3.axisLeft(yScale);
  svg
    .append("g")
    .attr("id", "y-axis")
    .attr("transform", `translate(${margin.left},${margin.top})`)
    .call(yAxis);
  // append the y axis text = Months
  svg
    .append("text")
    .style("text-anchor", "center")
    .attr(
      "transform",
      `translate(${(margin.left * 2) / 5},${
        (height + margin.top) / 2
      }) rotate(-90)`
    )
    .text("Months");

  // build the color scale from blue through yellow to red
  // there are 11 colors and we want to create 11 buckets
  // for the range of the min. temperature to the max. temperature
  // the color scale will be used with the legend as well as
  // for the individual cells of the heatmap matrix : year/month
  const colors = [
    "#a50026",
    "#d73027",
    "#f46d43",
    "#fdae61",
    "#fee090",
    "#ffffbf",
    "#e0f3f8",
    "#abd9e9",
    "#74add1",
    "#4575b4",
    "#313695",
  ].reverse();

  const numColors = colors.length;
  const colorRectHeight = 30;
  const colorRectWidth = 40;
  // the color scale is based on quantiles which are determined by the number
  // of colors, in this case 11. These are even steps.
  // for example the min. temperature is 1.68 and max. temperature is 13.89
  // the quantile step is (13.89 - 1.68) / 11 = 1.11.
  // the first color is determined for a temperature within the range of 1.68 and
  // 1.68 + 1.11 = 2.79 -> rounded of to 2.8, second = 2.79 to 2.79 + 1.11 etc
  const colorScale = d3
    .scaleQuantile()
    .domain([minTemp, maxTemp])
    .range(colors);

  // Create a color scale legend with an axis
  // generate an evenly spaced array between two values
  // to use when generating the colors of the legend
  // using colorScale, each entry is within the quantiles by
  // adding 0.1
  const legendRange = d3
    .range(minTemp, maxTemp, (maxTemp - minTemp) / numColors)
    .map((d) => Math.round((d + 0.1) * 100) / 100);

  // generate a array range for the legend axis tick labels
  const legendAxisRange = d3.range(
    minTemp,
    maxTemp,
    (maxTemp - minTemp) / numColors
  );
  // add the max. temperature to the array
  legendAxisRange.push(maxTemp);

  // add a g-group for the legend
  const legendYPos = height + margin.top + 25;
  const legendXpos = margin.left + width / 6.5;
  const legendGroup = svg
    .append("g")
    .attr("id", "legend")
    .attr("transform", "translate(" + legendXpos + "," + legendYPos + ")");

  // add the color legend blocks
  const legendColorBlocks = legendGroup
    .selectAll(".legend-color")
    .data(legendRange)
    .enter()
    .append("rect")
    .attr("class", "legend-color")
    .attr("height", colorRectHeight)
    .attr("width", colorRectWidth)
    .attr("x", (d, i) => i * colorRectWidth)
    .attr("fill", (d) => colorScale(d))
    .attr("stroke", "gray");

  // add the x axis for the legend
  const legendTicksScale = d3
    .scaleLinear()
    .domain([minTemp, maxTemp])
    .range([0, colorRectWidth * numColors]);

  const legendAxis = d3
    .axisBottom(legendTicksScale)
    .tickSize(5, 0)
    .tickValues(legendAxisRange)
    .tickFormat(d3.format(".1f"));
  // add a g-group for the legend axis for postioning
  const legendAxisGroup = legendGroup
    .append("g")
    .attr("transform", "translate(0," + colorRectHeight + ")");
  legendAxisGroup.call(legendAxis);

  // add text for the temperature color scale
  svg
    .append("text")
    .attr(
      "transform",
      `translate(${margin.left + 30}, ${
        svg.attr("height") - margin.bottom / 2.3
      })`
    )
    .text("Temperature Color Scale");

  // add a group for the rect cells showing
  const dataGroup = svg
    .append("g")
    .attr("id", "data")
    .attr("transform", `translate(${margin.left + 0.5},${margin.top + 0.5})`);

  // build the cells showing the temperature intensity for a given month and year as a color
  dataGroup
    .selectAll(".cell")
    .data(monthVar)
    .enter()
    .append("rect")
    .attr("class", "cell")
    .attr("x", (d) => xScale(d.year))
    .attr("y", (d) => yScale(d.monthStr))
    .attr("width", xScale.bandwidth())
    .attr("height", yScale.bandwidth())
    .attr("fill", (d) => colorScale(d.temperature))
    .attr("data-year", (d) => d.year)
    .attr("data-month", (d) => d.month)
    .attr("data-temp", (d) => d.temperature)
    // on mouse hover the hidden div tooltip (opacity = 0) will appear
    // displaying the details of the current cell by setting the opacity to 0.7
    .on("mouseover", (d) => {
      div.transition().duration(200).style("opacity", 0.7);
      div
        .html(
          d.year +
            " - " +
            d.monthStr +
            "<br/>" +
            round(d.temperature) +
            "&#8451;" +
            "<br/>" +
            round(d.variance) +
            "&#8451;"
        )
        .attr("data-year", d.year)
        .style("left", d3.event.pageX + 14 + "px")
        .style("top", d3.event.pageY - 28 + "px");
    })
    // on mouseout set opactity back to 0 to hide
    .on("mouseout", (d) => {
      div.transition().duration(500).style("opacity", 0);
    });
});
