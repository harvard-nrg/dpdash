import React, { Component } from 'react'
import GraphFactory from './components/GraphFactory'
import { connect } from 'react-redux'
import Drawer from './components/Drawer'
import Modal from './Modal.react'
import io from 'socket.io-client'
import 'whatwg-fetch'
import update from 'immutability-helper'
import FileSaver from 'file-saver'

import Dialog from 'material-ui/Dialog'
import FlatButton from 'material-ui/FlatButton'
import RaisedButton from 'material-ui/RaisedButton'
import MuiThemeProvider from 'material-ui/styles/MuiThemeProvider'
import { List, ListItem } from 'material-ui/List'
import * as _ from 'lodash'

const socketAddress = 'https://' + window.location.hostname + '/dashboard'
const socket = io(socketAddress, {
  requestTimeout: 1250,
  //    timeout: 1600,
  randomizationFactor: 0,
  reconnectionDelay: 0,
  autoConnect: false
})

class Subject extends Component {
  constructor(props) {
    super(props);
    this.state = {
      subject: {},
      graph: {},
      user: {},
      searchList: {},
      svgLink: {},
      startFromTheLastDay: false,
      graphWidth: 0,
      graphHeight: 0,
      startDay: 1,
      lastDay: null,
      maxDay: 1,
      socketIOSubjectRoom: null,
      socketIOUserRoom: null,
      taskId: '',
      openAvatarDialog: null,
      openConfigDialog: null,
      openStatDialog: null,
      metadata: {},
      configurations: {
        colormap: []
      },
      data: {
        matrix: {}
      }
    }
  }
  fetchMetadata = (study, subject, day) => {
    return fetch('/api/v1/studies/' + study + '/subjects/' + subject + '/deepdive/' + day, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json'
      },
      credentials: 'same-origin'
    }).then((response) => {
      if (response.status !== 201) {
        return
      }
      return response.json()
    }).then((response) => {
      this.setState({
        data: response
      })
    })
  }
  filterList = (event) => {
    let updatedList = this.state.searchList
    if (event.target.value !== "") {
      updatedList = this.props.user.acl.filter(function (item) {
        return (item['subjects'].toLowerCase().search(event.target.value.toLowerCase()) !== -1)
      })
    } else {
      //reset the acl
      updatedList = this.props.user.acl
    }

    this.setState({ searchList: updatedList })
  }

  generateListItem(acl) {
    let listItem = []
    for (let i in acl) {
      let link = '/dashboard/' + acl[i]['study'] + '/' + acl[i]['subjects']
      listItem.push(
        <ListItem href={link} target="_blank" primaryText={acl[i]['subjects']} secondaryText={acl[i]['study']} key={link} />
      )
    }
    return listItem
  }
  downloadPng = (event) => {
    let SID = this.props.subject.sid
    this.refs.canvas.toBlob((blob) => {
      FileSaver.saveAs(blob, SID + '.png')
    })
  }
  handleResize = (event) => {
    this.setState({
      graphWidth: window.innerWidth,
      graphHeight: window.innerHeight - 30
    })
  }
  resync = (event) => {
    if (!this.refs.resyncButton.disabled) {
      fetch(this.state.socketIOSubjectRoom, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        credentials: 'same-origin'
      }).then((response) => {
        if (response.status !== 201) {
          return
        }
        return response.json()
      }).then((response) => {
        this.setState({ taskId: response.correlationId })
      })
    }
    this.refs.resyncButton.disabled = true
    this.refs.resyncButtonIcon.className = 'hide'
    this.refs.resyncButtonSpinner.className = 'mdl-spinner mdl-js-spinner is-active resyncSpinner'
  }
  componentDidUpdate() {
  }
  componentWillMount() {
    //this.fetchConfigurations()
    //this.fetchMetadata(this.props.subject.project, this.props.subject.sid)
    //this.getData(this.props.subject.project, this.props.subject.sid, this.props.graph.matrixConfig)
    let maxDay = 1
    for (let dataIndex = 0; dataIndex < this.props.graph.matrixData.length; dataIndex++) {
      let maxObj = _.maxBy(this.props.graph.matrixData[dataIndex]['data'], function (o) { return o.day })
      if (maxObj == undefined) {
        continue
      }
      let day = maxObj['day']
      if (day > maxDay) {
        maxDay = day
      }
    }

    this.setState({
      maxDay: maxDay,
      subject: this.props.subject,
      user: this.props.user,
      iconBase64: this.props.user.icon,
      searchList: this.props.user.acl,
      socketIOSubjectRoom: '/resync/' + this.props.subject.project + '/' + this.props.subject.sid,
      socketIOUserRoom: this.props.user.uid
    })
    this.setState({ configurations: this.props.user.configs })
    if (!HTMLCanvasElement.prototype.toBlob) {
      Object.defineProperty(HTMLCanvasElement.prototype, 'toBlob', {
        value: function (callback, type, quality) {
          var binStr = atob(this.toDataURL(type, quality).split(',')[1]),
            len = binStr.length,
            arr = new Uint8Array(len)

          for (var i = 0; i < len; i++) {
            arr[i] = binStr.charCodeAt(i)
          }
          callback(new Blob([arr], { type: type || 'image/png' }))
        }
      })
    }
  }
  componentDidMount() {
    socket.open()
    let svgElement = this.refs.matrix.graph.el.lastChild
    this.setState({
      graphWidth: svgElement.getBBox().width + 20,
      graphHeight: svgElement.getBBox().height,
    },
      () => {
        // Download set-up
        let DOMURL = window.URL || window.webkitURL || window

        //svg conversion
        let updatedSvgElement = this.refs.matrix.graph.el.lastChild
        let svgString = (new XMLSerializer()).serializeToString(updatedSvgElement)
        let svgUrl = 'data:image/svg+xml; charset=utf8, ' + encodeURIComponent(svgString)

        let canvas = this.refs.canvas
        canvas.width = updatedSvgElement.getBBox().width
        canvas.height = updatedSvgElement.getBBox().height

        // png conversion
        let img = new Image()
        let ctx = canvas.getContext('2d')

        img.onload = () => {
          ctx.drawImage(img, 0, 0, canvas.width, canvas.height, 0, 0, canvas.width, canvas.height)
        }
        img.src = svgUrl

        this.setState({ svgLink: svgUrl, graphWidth: window.innerWidth, graphHeight: window.innerHeight - 30 })
      }
    )

    /* Resize listener register */
    window.addEventListener('resize', this.handleResize)

    /* Socket.io */
    socket.on('PROCESSING', message => {
    })

    socket.on('SUCCESS', message => {
      if (this.state.taskId === message.taskId) {
        socket.disconnect()
        this.refs.resyncButton.disabled = false
        this.refs.resyncButtonIcon.className = 'material-icons'
        this.refs.resyncButtonSpinner.className = 'mdl-spinner mdl-js-spinner'
        location.reload(true)
      }
    })
    socket.on('ERROR', message => {
    })
    socket.on('CONFIG_UPDATED', message => {
      if (message.uid === this.state.user.uid) {
        //    location.reload(true)
      }
    })
    /* dialog method register */
    this.setState({
      openAvatarDialog: this.refs.dialog.openAvatarDialog,
      openConfigDialog: this.refs.dialog.openConfigDialog,
      openStatDialog: this.refs.dialog.openStatDialog,
      openHelpDialog: this.refs.dialog.openHelpDialog
    })
  }

  componentWillUnmount() {
    socket.disconnect()
    socket.close()
    window.removeEventListener('resize', this.handleResize)
  }

  render() {
    return (
      <div>
        <Modal
          ref="dialog"
          uid={this.state.user.uid}
          icon={this.state.user.icon}
          mail={this.state.user.mail}
          name={this.state.user.name}
          configurations={this.state.configurations}
          matrixData={this.props.graph.matrixData}
          maxDay={this.state.maxDay}
        />
        <div className="mdl-layout mdl-js-layout mdl-layout--fixed-header">
          <header className="mdl-layout__header mdl-layout__header--transparent">
            <div className="mdl-layout__header-row">
              <span className="mdl-layout-title">{this.state.subject.sid}</span>
              <div className="mdl-layout-spacer"></div>
              <button id="statistics" className="mdl-button mdl-js-button mdl-button--icon" onClick={this.state.openStatDialog}>
                <i className="material-icons">functions</i>
              </button>
            </div>
          </header>
          <Drawer
            user={this.state.user.name}
            uid={this.state.user.uid}
            icon={this.state.iconBase64}
            openAvatarDialog={this.state.openAvatarDialog}
            openConfigDialog={this.state.openConfigDialog}
            openHelpDialog={this.state.openHelpDialog}
          />
          <main className="mdl-layout__content">
            <div className="page-content">
              <div className="Matrix">
                <GraphFactory
                  id="matrix"
                  type="matrix"
                  width={this.state.graphWidth}
                  height={this.state.graphHeight}
                  data={this.props.graph.matrixData}
                  study={this.state.subject.project}
                  subject={this.state.subject.sid}
                  consentDate={this.props.graph.consentDate}
                  ref="matrix"
                  configuration={this.props.graph.configurations}
                  startFromTheLastDay={this.state.startFromTheLastDay}
                  startDay={this.state.startDay}
                  lastDay={this.state.lastDay}
                  maxDay={this.state.maxDay}
                  user={this.state.user.uid}
                />
              </div>
              <div className="floatingButton">
                <a id="downloadPng" ref="downloadPng" onClick={this.downloadPng} className="mdl-button mdl-js-button mdl-button--fab mdl-button--mini-fab mdl-js-ripple-effect">
                  <i className="material-icons">image</i>
                </a>
                <br />
                <button id="resync" ref="resyncButton" className="mdl-button mdl-js-button mdl-button--fab mdl-button--mini-fab mdl-js-ripple-effect" onClick={this.resync}>
                  <i ref="resyncButtonIcon" className="material-icons">refresh</i>
                  <div ref="resyncButtonSpinner" className="mdl-spinner mdl-js-spinner"></div>
                </button>
              </div>
            </div>
          </main>
        </div>
        <div className="mdl-tooltip" data-mdl-for="statistics">statistics</div>
        <div className="mdl-tooltip" data-mdl-for="search">search</div>
        <div className="mdl-tooltip mdl-tooltip--left" data-mdl-for="downloadPng">download as png</div>
        <div className="mdl-tooltip mdl-tooltip--left" data-mdl-for="svgLink">download as svg</div>
        <div className="mdl-tooltip mdl-tooltip--left" data-mdl-for="resync">resync the page</div>
        <canvas ref="canvas" className="hidden"></canvas>
      </div>
    );
  }
}

const mapStateToProps = (state) => ({
  graph: state.graph,
  user: state.user,
  subject: state.subject
})

export default connect(mapStateToProps)(Subject)
