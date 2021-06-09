import * as d3 from 'd3';
import AbstractGraph from './AbstractGraph.d3';
import { getColor } from '../../server/utils/invertColor';
import { stringToDate } from '../../server/utils/dateConverter';
const margin = {
  top: 30,
  bottom: 20,
  left: 10,
  right: 30
}
export default class Matrix extends AbstractGraph {
  cleanData = (data, startDay, endDay) => {
    if (data.length > 0) {
      return data
    }
    let newData = []
    for (let i = startDay; i <= endDay; i++) {
      newData.push({ day: i })
    }
    return newData
  }
  create = (data) => {
    this.data = data
    this.cardSize = this.props.cardSize
    this.halfCardSize = this.cardSize / 2

    this.width = this.props.width - margin.right
    this.height = this.props.height - margin.top - margin.bottom
    let svgElement = d3.select(this.el).append("svg")
      .attr("width", () => { return this.width > 0 ? this.width : 0 })
      .attr("height", () => { return this.height > 0 ? this.height : 0 })
    this.svg = svgElement.append("g")

    //an array of days of the study
    let xAxisForDaysData = []
    this.startDayForFilter = this.props.startDay
    this.lastDayForFilter = (this.props.lastDay === null || this.props.lastDay === '') ? this.props.maxDay : this.props.lastDay
    let category = null
    this.cards = this.svg.append("g").attr("class", "Cards").attr("transform", "translate(0,0)")
    let yIndices = []

    for (let type = 0; type < data.length; type++) {
      if (category !== data[type]['category']) {
        category = data[type]['category']
        yIndices.push(type)
      }

      //d3.thresholdScale takes in range as (firstIndex, lastIndex]. This is a way around to ensure we get [firstIndex, lastIndex]
      let colors = data[type]['color'].slice()
      colors.unshift(data[type].color[0])
      let range = data[type].range.length == 2 ? d3.range(data[type].range[0], data[type].range[1], (data[type].range[1] - data[type].range[0]) / 8) : data[type].range
      let thresholdScale = d3.scaleThreshold()
        .domain(range)
        .range(colors)

      if (data[type] && data[type].hasOwnProperty('data')) {
        //append rectangles filled with colors <3
        let card = this.cards.selectAll(".cell")
          .data(this.cleanData(data[type].data, this.startDayForFilter, this.lastDayForFilter), (d) => {
            return data[type]['label'] + ":" + d.day
          })
        card.enter().append("rect")
          .filter((d) => {
            return (d.day >= this.startDayForFilter && d.day <= this.lastDayForFilter)
          })
          .attr("x", (d, i) => { return (d.day - this.startDayForFilter) * this.cardSize })
          .attr("y", (d, i) => { return type * this.cardSize })
          .attr("class", "Card hour")
          .attr("width", this.cardSize)
          .attr("height", this.cardSize)
          .style("fill", (d) => {
            if (d[data[type].variable] !== '' && d[data[type].variable] !== undefined) {
              return thresholdScale(d[data[type].variable])
            } else {
              return "#ffffff"
            }
          })
          .style("stroke", (d) => {
            if (d[data[type].variable] !== undefined) {
              return "#E6E6E6"
            } else {
              return "none"
            }
          })
          .style("stroke-width", "2px")
          .on("click", (d, i) => {
            let val = d[data[type].variable]
            if (val == '') {
              val = 'Not Available'
            }

            let s = 'The value for ' + data[type]['label'] + ' on day ' + d.day + ' is: ' + val
            alert(s)
          })
          .append("svg:title")
          .filter((d) => {
            return (d.day >= this.startDayForFilter && d.day <= this.lastDayForFilter)
          })
          .text((d) => { return d[data[type].variable] })
        if (data[type]['text'] == true) {
          card.enter().append("text")
            .filter((d) => { return (d.day >= this.startDayForFilter && d.day <= this.lastDayForFilter) })
            .text((d) => { return d[data[type].variable] })
            .attr("x", (d, i) => { return (d.day - this.startDayForFilter) * this.cardSize + this.halfCardSize })
            .attr("y", (d, i) => { return type * this.cardSize + (this.cardSize * 3 / 4) })
            .attr("font-size", this.cardSize / 2)
            .style("fill", (d) => {
              let blockColor = "#ffffff"
              if (d[data[type].variable] !== '' && d[data[type].variable] !== undefined) {
                blockColor = thresholdScale(d[data[type].variable])
              }
              return getColor(blockColor, true)
            })
            .attr("font-family", "Tahoma, Geneva, sans-serif")
            .style("text-anchor", "middle")
        }
      }
    }
    this.maxYAxisWidth = margin.left
    this.matrixHeight = margin.top //temp placeholder
    this.matrixWidth = this.svg.select(".Cards").node().getBoundingClientRect().width
    let leftMarginWhiteOut = this.generateMarginWhiteOutLeft(this.matrixHeight, this.maxYAxisWidth, margin.left)
    //an array of labels for the variables        
    let yAxisRange = []
    let yAxisValues = []
    for (let yAxisItem = 0; yAxisItem < data.length; yAxisItem++) {
      yAxisRange.push((yAxisItem + 1) * this.cardSize - this.halfCardSize)
      yAxisValues.push(yAxisItem)
    }
    this.yScaleLinear = d3.scaleLinear().range([this.halfCardSize, yAxisRange[yAxisRange.length - 1]]).domain([0, data.length - 1])
    this.yAxisLinear = d3.axisLeft(this.yScaleLinear).ticks(data.length - 1).tickValues(yAxisValues).tickSize(0)

    this.yAxisLeft = this.svg.append("g")
      .attr("class", "yAxisLinear")
      .call(this.yAxisLinear)
    this.yAxisLeft.selectAll("text")
      .data(this.data)
      .text((d) => { return d['label'] })
      .attr("font-size", this.cardSize / 2)
      .style("fill", "#545454")
    this.maxYAxisWidth = this.svg.select(".yAxisLinear").node().getBBox().width
    this.matrixHeight = this.svg.select(".yAxisLinear").node().getBBox().height + this.cardSize

    if (this.props.height == -1) {
      svgElement.attr("width", () => { return this.width > 0 ? this.width : 0 })
        .attr("height", this.matrixHeight + (this.cardSize * 2))
    } else if (this.props.height == 0 && this.props.width == 0) {
      svgElement.attr("width", () => { return this.width > 0 ? this.width : 0 })
        .attr("height", this.matrixHeight + (this.cardSize * 2))
      this.matrixHeight = this.matrixHeight + (this.cardSize * 3)
    }

    this.svg.attr("transform", "translate(" + (this.maxYAxisWidth + margin.left) + "," + margin.top + ")")
    leftMarginWhiteOut.attr("transform", "translate(-" + (this.maxYAxisWidth + margin.left) + ",-" + this.cardSize + ")")
    leftMarginWhiteOut.select("rect")
      .attr("width", this.maxYAxisWidth + margin.left)
      .attr("height", this.matrixHeight + this.cardSize)
    this.categoryMarker = this.generateCategoryMarker(this.matrixWidth, this.matrixHeight, this.maxYAxisWidth, yIndices)
    this.generateMarginWhiteOutBottom(this.matrixWidth, this.height, this.matrixHeight, this.maxYAxisWidth, margin.left)
    this.generateMarginWhiteOutTop(this.matrixWidth, this.maxYAxisWidth, margin.left)
    //Generating xAxis
    this.xAxisForDatesData = this.generateXAxisForDatesData(this.startDayForFilter, this.lastDayForFilter, this.props.consentDate)
    this.generateXAxis(this.height, this.matrixHeight, this.xAxisForDatesData, this.startDayForFilter, this.lastDayForFilter)
    this.generatePlotDataButton(this.maxYAxisWidth, this.height, this.matrixHeight, margin.left)
    this.generateWhiteSpaceTopLeft(this.maxYAxisWidth, margin.left)
    if (this.props.startFromTheLastDay) {
      this.update()
    }
    this.maxYScroll = Math.max(this.height, this.matrixHeight + margin.bottom + margin.top)
    this.maxXScroll = Math.max(this.width, this.matrixWidth + this.maxYAxisWidth + margin.left)
    this.zoom = d3.zoom()
      .scaleExtent([1, 5])
      .translateExtent([[0, 0], [this.maxXScroll, this.maxYScroll]])
      .on("zoom", this.zoomed)
    //for some reason, vertical scrolling works better with these statements. investigate.
    this.svg
      .call(this.zoom, d3.zoomIdentity)
      .on("wheel.zoom", this.pan)
      .on("mousewheel.zoom", this.pan)
      .on("DOMMouseScroll.zoom", this.pan)
  }
  zoomed = () => {
    let sourceEvent = d3.event.sourceEvent
    sourceEvent.preventDefault();

    let eventTransform = d3.event.transform
    this.cards.attr("transform", eventTransform)
    this.categoryMarker
      .attr("transform", "translate(" + (eventTransform.x - this.maxYAxisWidth) + "," + eventTransform.y + ") scale(" + eventTransform.k + ")")
    this.yAxisLeft.call(this.yAxisLinear.scale(eventTransform.rescaleY(this.yScaleLinear)))
    this.yAxisLeft.selectAll("text")
      .data(this.data)
      .text((d) => { return d['label'] })
      .attr("font-size", this.cardSize / 2)
      .style("fill", "#545454")
    this.xAxisBottom.call(this.xAxisLinearBottom.scale(eventTransform.rescaleX(this.xScaleLinearBottom)))
    this.xAxisTop.call(this.xAxisLinearTop.scale(eventTransform.rescaleX(this.xScaleLinearTop)))
    this.xAxisTop.selectAll("text")
      .data(this.xAxisForDatesData.filter((d, i) => {
        return (d.day >= this.startDayForFilter && d.day <= this.lastDayForFilter)
      }))
      .text((d) => { return d.marker })
      .attr("class", (d, i) => { return (d.marker == 'N/A') ? "EmptyDates" : "DatesText" })
    // } 
  }
  pan = () => {
    let sourceEvent = d3.event
    sourceEvent.preventDefault();

    let transformAttr = this.cards.attr("transform")
    let transformAttrArray = transformAttr.substring(transformAttr.indexOf("(") + 1, transformAttr.indexOf(")")).split(",")

    let x = parseInt(transformAttrArray[0])
    let y = parseInt(transformAttrArray[1])

    let mouseDelta = sourceEvent.wheelDelta || sourceEvent.detail
    let deltaX = sourceEvent.deltaX || -sourceEvent.wheelDeltaX || -(sourceEvent.axis == 1 ? mouseDelta : 0)
    let deltaY = sourceEvent.deltaY || -sourceEvent.wheelDeltaY || -(sourceEvent.axis == 2 ? mouseDelta : 0)
    let dx = -(deltaX) + x
    let dy = -(deltaY) + y

    //Disable zoom-in upon wheeling
    let eventTransform = d3.zoomIdentity.translate(dx, dy).scale(1)
    let transformation = eventTransform.scale(1 / eventTransform.k)
    if (dy >= 0 || this.matrixHeight < this.height) {
      dy = 0
    } else if (this.props.height == -1) {
      dy = 0
    } else {
      //30 for top axis
      let maxDy = (this.matrixHeight - this.height + 30) * (-1)
      if (dy < maxDy) {
        dy = maxDy
      }
    }
    if (this.matrixWidth < this.width) {
      dx = 0
    } else {
      //10 for margin left
      let maxDx = (this.matrixWidth - this.width + this.maxYAxisWidth + 10) * (-1)
      if (dx > 0) {
        dx = 0
      } else if (dx < maxDx) {
        dx = maxDx
      }
    }
    this.cards.attr("transform", "translate(" + dx + "," + dy + ")")
    this.categoryMarker.attr("transform", "translate(" + (dx - this.maxYAxisWidth) + "," + dy + ")")

    transformation = transformation.translate(dx - transformation.x, dy - transformation.y)
    this.yAxisLeft.call(this.yAxisLinear.scale(transformation.rescaleY(this.yScaleLinear)))
    this.yAxisLeft.selectAll("text")
      .data(this.data)
      .text((d) => { return d['label'] })
      .attr("font-size", this.cardSize / 2)
      .style("fill", "#545454")
    this.xAxisBottom.call(this.xAxisLinearBottom.scale(transformation.rescaleX(this.xScaleLinearBottom)))
    this.xAxisTop.call(this.xAxisLinearTop.scale(transformation.rescaleX(this.xScaleLinearTop)))
    this.xAxisTop.selectAll("text")
      .data(this.xAxisForDatesData.filter((d, i) => {
        return (d.day >= this.startDayForFilter && d.day <= this.lastDayForFilter)
      }))
      .text((d) => { return d.marker })
      .attr("font-size", this.cardSize / 2)
      .attr("class", (d, i) => { return (d.marker == 'N/A') ? "EmptyDates" : "DatesText" })
  }
  generateXAxisForDatesData = (firstDayOfStudy, lastDayOfStudy, consentDate) => {
    let xAxisForDatesData = []
    let startDate = stringToDate(consentDate, "yyyy-mm-dd", "-")
    let firstDay = firstDayOfStudy - 1 //Consent date is 1
    for (let i = firstDay; i < lastDayOfStudy; i++) {
      if (startDate.getDay() == 0 || startDate.getDay() == 6) {
        xAxisForDatesData.push({ 'day': i + 1, 'marker': 'S' })
      } else if (startDate.getDay() == 3) {
        let localeDate = (startDate.getMonth() + 1) + '/' + startDate.getDate() + '/' + startDate.getFullYear()
        xAxisForDatesData.push({ 'day': i + 1, 'marker': localeDate.substring(0, localeDate.length - 5) })
      } else {
        xAxisForDatesData.push({ 'day': i + 1, 'marker': 'N/A' })
      }
      startDate.setDate(startDate.getDate() + 1)
    }
    return xAxisForDatesData
  }
  generateCategoryMarker = (matrixWidth, matrixHeight, maxYAxisWidth, indices) => {
    const categoryMarker = this.svg.append("g")
      .attr("class", "CategoryMarker")
      .attr("transform", "translate(-" + maxYAxisWidth + ",0)")

    let yPosition = 0
    for (var i = 0; i < indices.length; i++) {
      if (i == 0) {
        yPosition = 1
      } else {
        yPosition = indices[i] * this.cardSize
      }
      categoryMarker.append("line")
        .attr("x1", 0)
        .attr("x2", (matrixWidth + maxYAxisWidth))
        .attr("y1", yPosition)
        .attr("y2", yPosition)
        .attr("stroke", "#545454")
    }
    categoryMarker.append("line")
      .attr("x1", 0)
      .attr("x2", (matrixWidth + maxYAxisWidth))
      .attr("y1", matrixHeight - this.cardSize / 2)
      .attr("y2", matrixHeight - this.cardSize / 2)
      .attr("stroke-width", 1.5)
      .attr("stroke", "#545454")
    return categoryMarker
  }
  generateXAxis = (pageHeight, matrixHeight, xAxisForDatesData, startDayForFilter, lastDayForFilter) => {
    let xAxisBottomYCoordinate = (pageHeight > 0 && pageHeight < matrixHeight) ? (pageHeight - (this.cardSize * 2) + 1) : matrixHeight - this.halfCardSize + 1
    let xAxisRange = []
    let xAxisValuesTop = []
    let xAxisValuesBottom = []
    for (let xAxisItem = 0; xAxisItem < xAxisForDatesData.length; xAxisItem++) {
      xAxisRange.push((xAxisItem + 1) * this.cardSize - this.halfCardSize)
      xAxisValuesBottom.push(xAxisForDatesData[xAxisItem].day.toString())
      xAxisValuesTop.push(xAxisItem)
    }

    this.xScaleLinearTop = d3.scaleLinear().range([this.halfCardSize, xAxisRange[xAxisRange.length - 1]]).domain([0, xAxisForDatesData.length - 1])
    this.xScaleLinearBottom = d3.scaleLinear().range([this.halfCardSize, xAxisRange[xAxisRange.length - 1]]).domain([startDayForFilter, xAxisForDatesData[xAxisForDatesData.length - 1].day])
    this.xAxisLinearTop = d3.axisTop(this.xScaleLinearTop)
      .ticks(xAxisForDatesData.length - 1)
      .tickValues(xAxisValuesTop)

    if (xAxisForDatesData.length > 1) {
      this.xAxisLinearBottom = d3.axisBottom(this.xScaleLinearBottom)
        .ticks(xAxisForDatesData.length - 1)
        .tickValues(xAxisValuesBottom)
        .tickFormat(d3.format("d"))

      this.xAxisBottom = this.svg.append("g")
        .attr("class", "xAxisLinearBottom")
        .attr("transform", (d, i) => { return "translate(0," + xAxisBottomYCoordinate + ")" })
        .call(this.xAxisLinearBottom)
      this.xAxisBottom.selectAll('text')
        .attr("font-size", (d, i) => {
          if (d.length <= 3) {
            return this.cardSize / 2
          }
          return (this.cardSize / (d.length - 1.5))
        })
        .style("fill", "#545454")

      this.xAxisBottom.selectAll('path')
        .attr('stroke-opacity', 0)
      this.xAxisBottom.selectAll('line')
        .attr('stroke-opacity', 0)
    }
    this.xAxisTop = this.svg.append("g")
      .attr("class", "xAxisLinearTop")
      .call(this.xAxisLinearTop)

    this.xAxisTop.selectAll("text")
      .data(xAxisForDatesData.filter((d, i) => { return (d.day >= startDayForFilter && d.day <= lastDayForFilter) }))
      .text((d) => { return d.marker })
      .attr("font-size", this.cardSize / 2)
      .attr("class", (d, i) => { return (d.marker == 'N/A') ? "EmptyDates" : "DatesText" })
      .style("fill", (d, i) => { return (d.marker == 'N/A') ? "#ffffff" : "#545454" })
      .on("click", (d, i) => {
        let day = d.day
        let link = '/deepdive/' + this.props.study + '/' + this.props.subject + '/' + day
        window.open(link, '_blank')
      })
    this.xAxisTop.selectAll('path')
      .attr('stroke-opacity', 0)
    this.xAxisTop.selectAll('line')
      .attr('stroke-opacity', 0)
  }
  generatePlotDataButton = (maxYAxisWidth, pageHeight, matrixHeight, margin) => {
    let xAxisBottomYCoordinate = (pageHeight > 0 && pageHeight < matrixHeight) ? (pageHeight - (this.cardSize * 1.5)) : matrixHeight
    const button = this.svg.append("g")
      .attr("class", "PlotDataButton")
      .attr("transform", "translate(-" + (maxYAxisWidth + this.halfCardSize) + "," + xAxisBottomYCoordinate + ")")
    button.append("rect")
      .attr("width", maxYAxisWidth + margin)
      .attr("height", this.cardSize)
      .attr("x", 0)
      .attr("y", -this.halfCardSize + 2)
      .style("fill", (d, i) => { return (this.props.width !== 0) ? "#ffffff" : "none" })
      .attr("class", "Button")
    button.append("text")
      .text("PLOT DATA")
      .attr("x", maxYAxisWidth / 2 - this.cardSize)
      .attr("y", this.halfCardSize / 4)
      .style("fill", "#545454")
      .attr("font-size", this.cardSize / 2)
      .attr("font-family", "'Helvetica Neue', Helvetica, Arial, sans-serif")
      .style("text-anchor", "start")
      .attr("class", "Button")
      .on("mouseover", function (d) { d3.select(this).classed("text-hover", true) })
      .on("mouseout", function (d) { d3.select(this).classed("text-hover", false) })
      .on("click", function (d, i) {
        alert('This feature is not yet available.')
      })
  }
  generateMarginWhiteOutLeft = (matrixHeight, maxYAxisWidth, margin) => {
    let marginWhiteOut = this.svg.append("g")
    marginWhiteOut.append("rect")
      .attr("width", maxYAxisWidth + margin + this.cardSize)
      .attr("height", matrixHeight + this.cardSize)
      .attr("x", 0)
      .attr("y", -this.halfCardSize + 2)
      .style("fill", (d, i) => { return (this.props.width !== 0) ? "#ffffff" : "none" })
    return marginWhiteOut
  }
  generateMarginWhiteOutTop = (matrixWidth, maxYAxisWidth, margin) => {
    let marginWhiteOut = this.svg.append("g")
    marginWhiteOut.append("rect")
      .attr("width", matrixWidth + maxYAxisWidth)
      .attr("height", this.cardSize + (this.halfCardSize))
      .attr("x", -maxYAxisWidth)
      .attr("y", -(this.cardSize + (this.halfCardSize)))
      .style("fill", (d, i) => { return (this.props.width !== 0) ? "#ffffff" : "none" })
    return marginWhiteOut
  }
  generateMarginWhiteOutBottom = (matrixWidth, pageHeight, matrixHeight, maxYAxisWidth, margin) => {
    let bottomYCoordinate = (pageHeight > 0 && pageHeight < matrixHeight) ? (pageHeight - (this.cardSize * 2) + 1) : matrixHeight - this.halfCardSize + 1
    let marginWhiteOut = this.svg.append("g")
      .attr("class", "marginBottom")
      .attr("transform", "translate(0," + bottomYCoordinate + ")")
    marginWhiteOut.append("rect")
      .attr("x", -(maxYAxisWidth))
      .attr("y", 0)
      .attr("width", matrixWidth + maxYAxisWidth)
      .attr("height", this.cardSize + 2)
      .style("fill", (d, i) => { return (this.props.width !== 0) ? "#ffffff" : "none" })
    return marginWhiteOut
  }
  generateWhiteSpaceTopLeft = (maxYAxisWidth, margin) => {
    const whiteSpaceTopLeft = this.svg.append("g")
    whiteSpaceTopLeft.append("rect")
      .attr("width", maxYAxisWidth + margin)
      .attr("height", this.cardSize)
      .attr("x", -(maxYAxisWidth + margin))
      .attr("y", -this.cardSize)
      .style("fill", (d, i) => { return (this.props.width !== 0) ? "#ffffff" : "none" })
  }
  update(data) {
    this.width = this.props.width - margin.right
    this.height = this.props.height - margin.top - margin.bottom
    d3.select(this.el).select('svg').style("width", this.width).style("height", this.height)
  }
}
