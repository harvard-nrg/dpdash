import React, { Component } from 'react'
import GraphFactory from './components/GraphFactory'
import { connect } from 'react-redux'
import io from 'socket.io-client'
import 'whatwg-fetch'
import FileSaver from 'file-saver'

import Button from '@material-ui/core/Button';
import ListItem from '@material-ui/core/ListItem';
import * as _ from 'lodash';

import AppBar from '@material-ui/core/AppBar';
import Toolbar from '@material-ui/core/Toolbar';
import IconButton from '@material-ui/core/IconButton';
import Typography from '@material-ui/core/Typography';

import { compose } from 'redux';
import { withStyles } from '@material-ui/core/styles';
import DrawerComponent from './components/Drawer';
import Drawer from '@material-ui/core/Drawer';

import SaveIcon from '@material-ui/icons/Save';
import CircularProgress from '@material-ui/core/CircularProgress';
import green from '@material-ui/core/colors/green';
import CheckIcon from '@material-ui/icons/Check';
import RefreshIcon from '@material-ui/icons/Refresh';
import Tooltip from '@material-ui/core/Tooltip';
import classNames from 'classnames';

import DialogActions from '@material-ui/core/DialogActions';
import DialogContent from '@material-ui/core/DialogContent';
import Dialog from '@material-ui/core/Dialog';
import Functions from '@material-ui/icons/Functions';

import Table from '@material-ui/core/Table';
import TableBody from '@material-ui/core/TableBody';
import TableCell from '@material-ui/core/TableCell';
import TableHead from '@material-ui/core/TableHead';
import TableRow from '@material-ui/core/TableRow';

import getAvatar from './fe-utils/avatarUtil';
import getCounts from './fe-utils/countUtil';
import { fetchSubjects } from './fe-utils/fetchUtil';

const drawerWidth = 200;

const socketAddress = 'https://' + window.location.hostname + '/dashboard'
const socket = io(socketAddress, {
  requestTimeout: 1250,
  randomizationFactor: 0,
  reconnectionDelay: 0,
  autoConnect: false
})

const styles = theme => ({
  root: {
    flexGrow: 1,
    height: '100vh',
    zIndex: 1,
    overflow: 'hidden',
    position: 'relative',
    display: 'flex',
    width: '100%',
  },
  appBar: {
    position: 'absolute',
    marginLeft: drawerWidth,
    [theme.breakpoints.up('md')]: {
      width: `calc(100% - 0px)`,
    },
    borderLeft: '1px solid rgba(0, 0, 0, 0.12)',
    backgroundColor: 'white',
    color: 'rgba(0, 0, 0, 0.54)'
  },
  navIconHide: {
  },
  drawerPaper: {
    width: drawerWidth,
    [theme.breakpoints.up('md')]: {
      position: 'relative',
    },
    borderRight: '0px'
  },
  content: {
    borderLeft: '1px solid rgba(0, 0, 0, 0.12)',
    flexGrow: 1,
    backgroundColor: '#fefefe',
    padding: theme.spacing.unit * 3,
  },
  wrapper: {
    margin: theme.spacing.unit,
    position: 'relative',
  },
  buttonSuccess: {
    backgroundColor: green[500],
    '&:hover': {
      backgroundColor: green[700],
    },
  },
  fabProgress: {
    color: green[500],
    position: 'absolute',
    bottom: -6,
    left: -6,
    zIndex: 1,
  },
  buttonProgress: {
    color: green[500],
    position: 'absolute',
    top: '50%',
    left: '50%',
    marginTop: -12,
    marginLeft: -12,
  },
});

const CustomTableCell = withStyles(theme => ({
  head: {
    backgroundColor: theme.palette.common.black,
    color: theme.palette.common.white,
  },
  body: {
    fontSize: 14,
  },
}))(TableCell);

class Graph extends Component {
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
      metadata: {},
      configurations: {
        colormap: []
      },
      data: {
        matrix: {}
      },
      mobileOpen: false,
      icon: '',
      totalSubjects: 0,
      totalStudies: 0,
      totalDays: 0,
      loading: false,
      success: false,
      cardSize: 50,
      openStat: false
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
  downloadPng = () => {
    let SID = this.props.subject.sid
    this.refs.canvas.toBlob((blob) => {
      FileSaver.saveAs(blob, SID + '.png')
    })
  }
  handleResize = () => {
    this.setState({
      graphWidth: window.innerWidth,
      graphHeight: window.innerHeight - 30
    })
  }
  resync = () => {
    window.fetch(this.state.socketIOSubjectRoom, {
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
      this.setState({ taskId: response.correlationId, loading: true, success: false })
    })
  }
  closeStat = () => {
    this.setState({
      openStat: false,
    });
  }
  openStat = () => {
    this.setState({
      openStat: true,
    });
  }
  componentDidUpdate() {
  }
  // eslint-disable-next-line react/no-deprecated
  async componentWillMount() {
    try {
      const acl = await fetchSubjects();
      this.setState(getCounts({ acl }));
    } catch (err) {
      console.error(err.message);
    }
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
  handleDrawerToggle = () => {
    this.setState(state => ({ mobileOpen: !state.mobileOpen }));
  }
  generateStatItem(data) {
    let tableItem = []
    for (let i in data) {
      let dataItem = data[i]
      let validData = _.filter(dataItem['data'], _.conforms({ [dataItem['variable']]: function (n) { return _.isNumber(n) } }))
      let missingDataPercentage = 100 - (validData.length * 100 / this.state.maxDay)
      tableItem.push(
        <TableRow key={i + dataItem['label']}>
          <CustomTableCell>{dataItem['label']}</CustomTableCell>
          <CustomTableCell>{(dataItem['stat'].length > 0 && !isNaN(parseFloat(dataItem['stat'][0].min) && isFinite(dataItem['stat'][0].min)) ? dataItem['stat'][0].min.toFixed(2) : 'N/A')}</CustomTableCell>
          <CustomTableCell>{(dataItem['stat'].length > 0 && !isNaN(parseFloat(dataItem['stat'][0].max) && isFinite(dataItem['stat'][0].max)) ? dataItem['stat'][0].max.toFixed(2) : 'N/A')}</CustomTableCell>
          <CustomTableCell>{(dataItem['stat'].length > 0 && !isNaN(parseFloat(dataItem['stat'][0].mean) && isFinite(dataItem['stat'][0].mean)) ? dataItem['stat'][0].mean.toFixed(2) : 'N/A')}</CustomTableCell>
          <CustomTableCell id={'stat-missingdata-' + i} title={validData.length + '/' + this.state.maxDay}>{missingDataPercentage.toFixed(2) + ' (' + validData.length + '/' + this.state.maxDay + ')'}</CustomTableCell>
        </TableRow>
      )
    }
    return tableItem
  }
  componentDidMount() {
    socket.open()
    this.setState({
      avatar: getAvatar({ user: this.props.user })
    })
    if (this.refs.matrix.graph === undefined) {
      console.log('error');
      return
    }
    let svgElement = this.refs.matrix.graph.el.lastChild
    this.setState({
      graphWidth: svgElement.getBBox().width + 20,
      graphHeight: svgElement.getBBox().height,
    },
      () => {
        // Download set-up

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

        this.setState({
          svgLink: svgUrl,
          graphWidth: window.innerWidth,
          graphHeight: window.innerHeight - 30,
          cardSize: 20
        })
      }
    )

    /* Resize listener register */
    window.addEventListener('resize', this.handleResize)

    /* Socket.io */
    socket.on('PROCESSING', () => {
    })

    socket.on('SUCCESS', message => {
      if (this.state.taskId === message.taskId) {
        socket.disconnect();
        this.setState({
          loading: false,
          success: true
        },
          () => {
            setTimeout(() => {
              location.reload(true)
            }, 2000)
          });
      }
    })
    socket.on('ERROR', () => {
    })
    socket.on('CONFIG_UPDATED', message => {
      if (message.uid === this.state.user.uid) {
        //    location.reload(true)
      }
    })
  }

  componentWillUnmount() {
    socket.disconnect()
    socket.close()
    window.removeEventListener('resize', this.handleResize)
  }

  render() {
    const { loading, success } = this.state;
    const { classes, theme } = this.props;
    const buttonClassname = classNames({
      [classes.buttonSuccess]: success,
    });
    return (
      <div
        className={classes.root}
      >
        <AppBar className={classes.appBar}>
          <Toolbar
            variant='dense'
            style={{
              paddingLeft: '16px'
            }}
          >
            <IconButton
              color="rgba(0, 0, 0, 0.54)"
              aria-label="Open drawer"
              onClick={this.handleDrawerToggle}
            >
              <img width='24px' height='24px' src='/img/favicon.png' />
            </IconButton>
            <Typography
              variant="title"
              color="inherit"
              style={{
                color: 'rgba(0,0,0,0.4)',
                fontSize: '18px',
                letterSpacing: '1.25px',
                flexGrow: 1
              }}
            >
              {this.state.subject.sid + ' - ' + this.state.subject.project}
            </Typography>
            <IconButton
              color="rgba(0, 0, 0, 0.54)"
              aria-label="Open Stat"
              onClick={this.openStat}
            >
              <Functions />
            </IconButton>
          </Toolbar>
        </AppBar>
        <Drawer
          variant="temporary"
          anchor={theme.direction === 'rtl' ? 'right' : 'left'}
          open={this.state.mobileOpen}
          onClose={this.handleDrawerToggle}
          classes={{
            paper: classes.drawerPaper,
          }}
          ModalProps={{
            keepMounted: true, // Better open performance on mobile.
          }}
        >
          <DrawerComponent
            avatar={this.state.avatar}
            totalStudies={this.state.totalStudies}
            totalSubjects={this.state.totalSubjects}
            totalDays={this.state.totalDays}
            user={this.props.user}
            name={this.props.user.name}
          />
        </Drawer>
        <div
          className={classes.content}
          style={{
            padding: '12px',
            marginTop: '48px',
            overflowY: 'scroll'
          }}
        >
          <div className="Matrix">
            <GraphFactory
              id="matrix"
              type="matrix"
              width={this.state.graphWidth}
              height={this.state.graphHeight}
              data={this.props.graph.matrixData}
              cardSize={this.state.cardSize}
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
          <div
            style={{
              right: 10,
              bottom: 10,
              position: 'fixed'
            }}
          >
            <Button
              variant="fab"
              onClick={this.downloadPng}
              id="downloadPng"
              ref="downloadPng"
              focusRipple={true}
              style={{
                marginBottom: '6px'
              }}
            >
              <Tooltip title="Download as PNG">
                <SaveIcon />
              </Tooltip>
            </Button>
            <div>
              <Button
                variant="fab"
                color="secondary"
                className={buttonClassname}
                onClick={this.resync}
              >
                <Tooltip title="Resync with the File System">
                  {success ? <CheckIcon /> : <RefreshIcon />}
                </Tooltip>
              </Button>
              {loading && <CircularProgress size={68} className={classes.fabProgress} />}
            </div>
          </div>
        </div>
        <Dialog
          modal={false}
          open={this.state.openStat}
          onClose={this.closeStat}
        >
          <DialogContent
            style={{
              padding: '0'
            }}
          >
            <Table
            >
              <TableHead
              >
                <TableRow>
                  <CustomTableCell> Label </CustomTableCell>
                  <CustomTableCell> Min </CustomTableCell>
                  <CustomTableCell> Max </CustomTableCell>
                  <CustomTableCell> Mean </CustomTableCell>
                  <CustomTableCell> Missing % </CustomTableCell>
                </TableRow>
              </TableHead>
              <TableBody
              >
                {this.generateStatItem(this.props.graph.matrixData)}
              </TableBody>
            </Table>
          </DialogContent>
          <DialogActions>
            <Button
              color="secondary"
              onClick={this.closeStat}
            >Close</Button>
          </DialogActions>
        </Dialog>
        <canvas ref="canvas" style={{ display: 'none' }}></canvas>
      </div>
    );
  }
}

const mapStateToProps = (state) => ({
  graph: state.graph,
  user: state.user,
  subject: state.subject
})

export default compose(
  withStyles(styles, { withTheme: true }),
  connect(mapStateToProps)
)(Graph);
