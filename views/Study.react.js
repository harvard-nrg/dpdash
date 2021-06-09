import React, { Component } from 'react'
import GraphFactory from './components/GraphFactory'
import { connect } from 'react-redux'
import 'whatwg-fetch'

import { stringToDate, diffDates } from '../server/utils/dateConverter'
import * as _ from 'lodash'

import { emphasize } from '@material-ui/core/styles/colorManipulator';
import { compose } from 'redux';
import { withStyles } from '@material-ui/core/styles';
import Divider from '@material-ui/core/Divider';

import Header from './components/Header';
import Sidebar from './components/Sidebar';
import getAvatar from './fe-utils/avatarUtil';
import { fetchSubjects } from './fe-utils/fetchUtil';
import getCounts from './fe-utils/countUtil';

const drawerWidth = 200;

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
  content: {
    borderLeft: '1px solid rgba(0, 0, 0, 0.12)',
    flexGrow: 1,
    backgroundColor: '#fefefe',
    padding: theme.spacing.unit * 3,
  },
  input: {
    display: 'flex',
    padding: 0,
  },
  valueContainer: {
    display: 'flex',
    flexWrap: 'wrap',
    flex: 1,
    alignItems: 'center',
  },
  chip: {
    margin: `${theme.spacing.unit / 2}px ${theme.spacing.unit / 4}px`,
  },
  chipFocused: {
    backgroundColor: emphasize(
      theme.palette.type === 'light' ? theme.palette.grey[300] : theme.palette.grey[700],
      0.08,
    ),
  },
  noOptionsMessage: {
    padding: `${theme.spacing.unit}px ${theme.spacing.unit * 2}px`,
  },
  singleValue: {
    fontSize: 16,
  },
  placeholder: {
    position: 'absolute',
    left: 2,
    fontSize: 16,
  },
  paper: {
    marginTop: theme.spacing.unit,
    position: 'absolute',
    width: '100%'
  },
});

class Study extends Component {
  constructor(props) {
    super(props);
    this.state = {
      subject: {},
      graph: {},
      user: {},
      svgLink: {},
      startFromTheLastDay: false,
      graphWidth: window.innerWidth,
      width: 0,
      height: 0,
      marginHeight: 48,
      marginWidth: 24,
      graphHeight: -1,
      startDay: 1,
      lastDay: null,
      openAvatarDialog: null,
      openConfigDialog: null,
      openStatDialog: null,
      metadata: {},
      configurations: {
        colormap: []
      },
      data: {
        matrix: {}
      },
      timezone: {
        timeZone: 'America/New_York'
      },
      complete: {},
      today: '',
      todayDateObject: null,
      weeksToView: 4,
      totalStudies: 0,
      totalSubjects: 0,
      totalDays: 0,
      mobileOpen: false
    }
  }

  handleDrawerToggle = () => {
    this.setState(state => ({ mobileOpen: !state.mobileOpen }));
  };
  handleResize = () => {
    this.setState({
      width: window.innerWidth - this.state.marginWidth,
      height: window.innerHeight - this.state.marginHeight
    })
  }
  generateMatrices = (matrixDataList) => {
    let matrixList = []
    if (matrixDataList.length < 1) {
      return matrixList
    }

    for (var item in matrixDataList) {
      let maxDay = 1
      for (let dataIndex = 0; dataIndex < matrixDataList[item].matrixData.length; dataIndex++) {
        let maxObj = _.maxBy(matrixDataList[item].matrixData[dataIndex]['data'], function (o) { return o.day })
        if (maxObj == undefined) {
          continue
        }
        let day = maxObj['day']
        if (day > maxDay) {
          maxDay = day
        }
      }
      let consentDate = matrixDataList[item].consentDate
      let consentDateObject = stringToDate(consentDate, "yyyy-mm-dd", "-")

      let daysToView = this.state.weeksToView * 7

      let numOfDays = maxDay;
      let tempDateObj = new Date(consentDateObject.getTime());
      let completed = (matrixDataList[item].project in this.state.complete && this.state.complete[matrixDataList[item].project].indexOf(matrixDataList[item].subject) > -1);
      if (!completed) {
        numOfDays = diffDates(consentDateObject, this.state.todayDateObject);
        tempDateObj = new Date(this.state.todayDateObject.getTime())
      }
      tempDateObj.setDate(tempDateObj.getDate() - daysToView);

      let link = '/dashboard/' + matrixDataList[item].project + '/' + matrixDataList[item].subject
      matrixList.push(
        <div className="StudyView">
          {completed ? <a className="subjectID" style={{ fontFamily: '"Roboto", sans-serif', textDecoration: 'none', paddingBottom: '8px' }} target="_blank" href={link} rel="noreferrer"> {matrixDataList[item].subject + ' (Complete)'}</a> : <a className="subjectID" style={{ fontFamily: '"Roboto", sans-serif', textDecoration: 'none', paddingBottom: '8px' }} target="_blank" href={link} rel="noreferrer"> {matrixDataList[item].subject}</a>}
          <GraphFactory
            id="matrix"
            type="matrix"
            width={this.state.width < 960 ? this.state.width : this.state.width - drawerWidth}
            height={this.state.graphHeight}
            data={matrixDataList[item].matrixData}
            subject={matrixDataList[item].subject}
            study={matrixDataList[item].project}
            consentDate={tempDateObj.toISOString().substring(0, 10)}
            ref="matrix"
            configuration={this.state.configurations}
            startFromTheLastDay={this.state.startFromTheLastDay}
            startDay={(numOfDays > daysToView) ? (numOfDays - daysToView + 1) : 1}
            lastDay={(numOfDays > daysToView) ? numOfDays : null}
            cardSize={20}
            maxDay={maxDay}
            user={this.state.user.uid}
          />
          <Divider
            style={{
              marginTop: '4px',
              marginBottom: '16px'
            }}
          />
        </div>
      )
    }

    return matrixList
  }
  fetchUserPreferences = (uid) => {
    let star = this.state.star;
    let complete = this.state.complete;
    return fetch('/api/v1/users/' + uid + '/preferences', {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json'
      },
      credentials: 'same-origin'
    }).then((response) => {
      if (response.status !== 200) {
        return
      }
      return response.json()
    }).then((response) => {
      if (response) {
        star = 'star' in response ? response['star'] : star;
        complete = 'complete' in response ? response['complete'] : complete;
      }
      this.setState({
        star: star,
        complete: complete,
        preferences: response
      });
      return;
    });
  }
  // eslint-disable-next-line react/no-deprecated
  async componentWillMount() {
    let today = new Date().toLocaleDateString('en-US', this.state.timezone)
    this.setState({
      todayDateObject: stringToDate(today, 'mm/dd/yyyy', '/'),
      subject: this.props.subject,
      user: this.props.user,
      configurations: this.props.graph.configurations
    });
    this.fetchUserPreferences(this.props.user.uid);
    try {
      const acl = await fetchSubjects();
      this.setState(getCounts({ acl }));
    } catch (err) {
      console.error(err.message);
    }
  }
  componentDidMount() {
    /* Resize listener register */
    window.addEventListener('resize', this.handleResize)
    this.setState({
      width: window.innerWidth - this.state.marginWidth,
      height: window.innerHeight - this.state.marginHeight,
      avatar: getAvatar({ user: this.props.user })
    })
  }
  componentWillUnmount() {
    window.removeEventListener('resize', this.handleResize)
  }
  render() {
    const { classes } = this.props;
    return (
      <div className={classes.root}>
        <Header 
          title={this.props.subject.project}
          handleDrawerToggle={this.handleDrawerToggle}
          isAccountPage={false}
        />
        <Sidebar
          avatar={this.state.avatar}
          handleDrawerToggle={this.handleDrawerToggle}
          mobileOpen={this.state.mobileOpen}
          totalDays={this.state.totalDays}
          totalStudies={this.state.totalStudies}
          totalSubjects={this.state.totalSubjects}
          user={this.props.user}
        />
        <div
          className={classes.content}
          style={{
            padding: '12px',
            marginTop: '64px',
            overflowY: 'scroll'
          }}
        >
          {this.generateMatrices(this.props.graph.matrixData)}
        </div>
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
)(Study);
