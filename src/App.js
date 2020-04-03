import React, { Component } from 'react'
import RowData from './RowData'
import Chart from "react-apexcharts";

import logo from './logo.svg'
import io from 'socket.io-client'

var lastDate = 0;
var data = []
var TICKINTERVAL = 86400000
let XAXISRANGE = 777600000

var _seed = 41
Math.random = function() {
  _seed = (_seed * 16807) % 2147483647
  return (_seed - 1) / 2147483646
}

function getDayWiseTimeSeries(baseval, count, yrange) {
  console.log("getDayWiseTimeSeries")
  var i = 0;
  while (i < count) {
    var x = baseval;
    var y = Math.floor(Math.random() * (yrange.max - yrange.min + 1)) + yrange.min;

    data.push({
      x, y
    });
    lastDate = baseval
    baseval += TICKINTERVAL;
    i++;
  }
  console.log(data)
}

getDayWiseTimeSeries(new Date('11 Feb 2017 GMT').getTime(), 10, {
  min: 10,
  max: 90
})

function getNewSeries(baseval, yrange,ws) {
  console.log("getNewSeries data len: "+data.length)
  var newDate = baseval + TICKINTERVAL;
  lastDate = newDate

  for(var i = 0; i< data.length - 10; i++) {
    // IMPORTANT
    // we reset the x and y of the data which is out of drawing area
    // to prevent memory leaks
    data[i].x = newDate - XAXISRANGE - TICKINTERVAL
    data[i].y = 0
  }

  data.push({
    x: newDate,
    y: ws //Math.floor(Math.random() * (yrange.max - yrange.min + 1)) + yrange.min
  })
}

function resetData(){
  console.log("resetData")
  // Alternatively, you can also reset the data at certain intervals to prevent creating a huge series 
  data = data.slice(data.length - 10, data.length);
}

class App extends Component {
  constructor (props) {
    super(props)

    this.state = {
      cities: [
      ],
      options: {
        chart: {
          id: 'realtime',
          height: 350,
          type: 'line',
          animations: {
            enabled: true,
            easing: 'linear',
            dynamicAnimation: {
              speed: 1000
            }
          },
          toolbar: {
            show: true
          },
          zoom: {
            enabled: true
          }
        },
        dataLabels: {
          enabled: true
        },
        stroke: {
          curve: 'smooth'
        },
        title: {
          text: 'Dynamic Updating Chart',
          align: 'left'
        },
        markers: {
          size: 0
        },
        xaxis: {
          type: 'datetime',
          range: XAXISRANGE,
        },
        yaxis: {
          max: 100
        },
        legend: {
          show: true
        },
      },
      series: [
        {
          name: "WindSpeed",
          data: data.slice()
        },
        {
          name: "WindMax",
          data: data.slice()
        }
      ]
    }
    this.socket = io('http://127.0.0.1:8088')
    this.updateData = this.updateData.bind(this)
    this.createId = this.createId.bind(this)
  }

  createId () {
    this.uniqueId = this.uniqueId || 0
    return this.uniqueId++
  }

  componentDidMount () {
    this.socket.on('app', (received) => {
      this.updateData(received)
    })
    // window.setInterval(() => {
    //   getNewSeries(lastDate, {
    //     min: 10,
    //     max: 90
    //   }, 
    //   this.props.windspeed)

    //   this.setState({
    //     series: [
    //       {
    //         name: "series-1",
    //         data: data.slice()
    //       }
    //     ]
    //   })
    // }, 1000)
  }

  componentWillUnmount () {
    this.socket.close()
  }

  updateData (received) {
    // List of current cities in state
    const cityList = this.state.cities.map(city => city.name)
    if (cityList.includes(received.name)) {
      // Updating a city
      this.setState(prevState => ({
        cities: prevState.cities.map(
          city => (city.name !== received.name) ? city : {...received, id: city.id}
        )
      }))
    } else {
      // New city being added
      this.setState(prevState => ({
        cities: [
          ...prevState.cities,
          {
            id: this.createId(),
            ...received
          }
        ]
      }))
    }

    getNewSeries(lastDate, {
      min: 10,
      max: 90
    }, 
    received.windspeed)

    this.setState({
      series: [
        {
          name: "series-1",
          data: data.slice()
        }
      ]
    })
  }

  render () {
    const cityRows = this.state.cities.map(RowData)
    return (
      <div className='container'>
        <div className='mt-3 text-center'>
          <img src={logo} className='logo' alt='logo' />
        </div>
        <span className='spacer' />
        <div className='row'>
          {cityRows}
        </div>
        <div id="chart">
            <Chart options={this.state.options} series={this.state.series} type="line" height={350} />
        </div>
      </div>
      
    )
  }
}

export default App
