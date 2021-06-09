import React, { Component } from 'react';
import { compose } from 'redux';
import { connect } from 'react-redux';
import 'whatwg-fetch';
import Select from 'react-select';
import classNames from 'classnames';
import _ from "lodash";
import { Column, Table } from 'react-virtualized';
import moment from 'moment';
import update from 'immutability-helper';

import { withStyles } from '@material-ui/core/styles';
import AppBar from '@material-ui/core/AppBar';
import Toolbar from '@material-ui/core/Toolbar';
import Typography from '@material-ui/core/Typography';
import IconButton from '@material-ui/core/IconButton';
import TextField from '@material-ui/core/TextField';
import NoSsr from '@material-ui/core/NoSsr';
import { emphasize } from '@material-ui/core/styles/colorManipulator';
import Paper from '@material-ui/core/Paper';
import MenuItem from '@material-ui/core/MenuItem';
import Chip from '@material-ui/core/Chip';
import Checkbox from '@material-ui/core/Checkbox';

import StarBorder from '@material-ui/icons/StarBorder';
import Star from '@material-ui/icons/Star';
import CheckBoxOutlineBlankIcon from '@material-ui/icons/CheckBoxOutlineBlank';
import CheckBoxIcon from '@material-ui/icons/CheckBox';
import SearchIcon from '@material-ui/icons/Search';

import Sidebar from './components/Sidebar';
import getAvatar from './fe-utils/avatarUtil';
import { fetchSubjects } from './fe-utils/fetchUtil';

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
  appBar: {
    position: 'absolute',
    marginLeft: drawerWidth,
    [theme.breakpoints.up('md')]: {
      width: `calc(100% - ${drawerWidth}px)`,
    },
    borderLeft: '1px solid rgba(0, 0, 0, 0.12)',
    backgroundColor: 'white',
    color: 'rgba(0, 0, 0, 0.54)'
  },
  navIconHide: {
    [theme.breakpoints.up('md')]: {
      display: 'none',
    },
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

function NoOptionsMessage(props) {
  return (
    <Typography
      color="textSecondary"
      className={props.selectProps.classes.noOptionsMessage}
      {...props.innerProps}
    >
      {props.children}
    </Typography>
  );
}
function inputComponent({ inputRef, ...props }) {
  return <div ref={inputRef} {...props} />;
}
function Control(props) {
  return (
    <TextField
      fullWidth
      InputProps={{
        inputComponent,
        inputProps: {
          className: props.selectProps.classes.input,
          inputRef: props.innerRef,
          children: props.children,
          ...props.innerProps,
        },
        disableUnderline: true
      }}
      {...props.selectProps.textFieldProps}
    />
  );
}
function Option(props) {
  var index = props.children.indexOf(' ');
  return (
    <MenuItem
      buttonRef={props.innerRef}
      selected={props.isFocused}
      component="div"
      style={{
        fontWeight: props.isSelected ? 500 : 400,
      }}
      {...props.innerProps}
    >
      <Typography
        color='textPrimary'
      >
        {props.children.substr(0, index)}
      </Typography>
            &nbsp;
      <Typography
        color="textSecondary"
        noWrap={true}
      >
        {props.children.substr(index)}
      </Typography>
    </MenuItem>
  );
}
function Placeholder(props) {
  return (
    <Typography
      color="textSecondary"
      className={props.selectProps.classes.placeholder}
      {...props.innerProps}
    >
      {props.children}
    </Typography>
  );
}
function SingleValue(props) {
  return (
    <Typography className={props.selectProps.classes.singleValue} {...props.innerProps}>
      {props.children}
    </Typography>
  );
}
function ValueContainer(props) {
  return <div className={props.selectProps.classes.valueContainer}>{props.children}</div>;
}
function MultiValue(props) {
  return (
    <Chip
      tabIndex={-1}
      label={
        props.children
      }
      className={classNames(props.selectProps.classes.chip, {
        [props.selectProps.classes.chipFocused]: props.isFocused,
      })}
      onDelete={event => {
        props.removeProps.onClick();
        props.removeProps.onMouseDown(event);
      }}
    />
  );
}
function Menu(props) {
  return (
    <Paper square className={props.selectProps.classes.paper} {...props.innerProps}>
      {props.children}
    </Paper>
  );
}
function DropdownIndicator() {
  return (
    <SearchIcon color='disabled' />
  );
}
const indicatorSeparatorStyle = {
  display: 'none'
};

const IndicatorSeparator = ({ innerProps }) => {
  return (
    <span style={indicatorSeparatorStyle} {...innerProps} />
  );
};

var autocomplete = [];
var default_acl = [];

class MainPage extends Component {
  constructor(props) {
    super(props);
    this.state = {
      acl: [],
      default_acl: [],
      mobileOpen: false,
      icon: '',
      totalSubjects: 0,
      totalStudies: 0,
      totalDays: 0,
      search: [],
      search_array: [],
      width: 0,
      height: 0,
      marginHeight: 72,
      marginWidth: 24,
      sortBy: '',
      sortDirection: 'ASC',
      preferences: {},
      star: {},
      complete: {}
    };
  }
  componentDidUpdate() {
  }
  componentDidMount() {
    this.setState({
      width: window.innerWidth - this.state.marginWidth,
      height: window.innerHeight - this.state.marginHeight,
      avatar: getAvatar({ user: this.props.user })
    });
    window.addEventListener('resize', this.handleResize)
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
  handleComplete = (e, checked, cellData) => {
    var study = cellData['rowData']['study'];
    var subject = cellData['rowData']['subject'];
    if (checked == true) {
      this.complete(study, subject);
    } else {
      this.incomplete(study, subject);
    }
  }
  handleStar = (e, checked, cellData) => {
    var study = cellData['rowData']['study'];
    var subject = cellData['rowData']['subject'];
    if (checked == true) {
      this.favorite(study, subject);
    } else {
      this.unfavorite(study, subject);
    }
  }
  favorite = (study, subject) => {
    const newState = this.state.star;
    if (study in newState) {
      let subjectIndex = newState[study].indexOf(subject);
      if (subjectIndex == -1) {
        let updated = update(this.state.star, {
          [study]: {
            $push: [subject]
          }
        });
        this.setState({ star: updated });
        this.updateUserStars(updated);
        this.starAcl(this.state.default_acl, updated);
      } else {
        //already favorited
      }
    } else {
      let updated = update(this.state.star, {
        [study]: {
          $set: [subject]
        }
      });
      this.updateUserStars(updated);
      this.setState({
        star: updated,
      });
      this.starAcl(this.state.default_acl, updated);
    }
  }
  unfavorite = (study, subject) => {
    const newState = this.state.star;
    if (study in newState) {
      let subjectIndex = newState[study].indexOf(subject);
      if (subjectIndex > -1) {
        let updated = update(this.state.star, {
          [study]: {
            $splice: [[subjectIndex, 1]]
          }
        });
        this.updateUserStars(updated);
        this.setState({
          star: updated,
        });
        this.starAcl(this.state.default_acl, updated);
      }
    }
  }
  complete = (study, subject) => {
    const newState = this.state.complete;
    if (study in newState) {
      let subjectIndex = newState[study].indexOf(subject);
      if (subjectIndex == -1) {
        let updated = update(this.state.complete, {
          [study]: {
            $push: [subject]
          }
        });
        this.setState({ complete: updated });
        this.updateUserComplete(updated);
      } else {
        //already favorited
      }
    } else {
      let updated = update(this.state.complete, {
        [study]: {
          $set: [subject]
        }
      });
      this.updateUserComplete(updated);
      this.setState({
        complete: updated,
      });
    }
  }
  incomplete = (study, subject) => {
    const newState = this.state.complete;
    if (study in newState) {
      let subjectIndex = newState[study].indexOf(subject);
      if (subjectIndex > -1) {
        let updated = update(this.state.complete, {
          [study]: {
            $splice: [[subjectIndex, 1]]
          }
        });
        this.updateUserComplete(updated);
        this.setState({
          complete: updated,
        });
      }
    }
  }
  starAcl = (default_acl, stars) => {
    var starred_acl = [];
    var unstarred_acl = [];
    for (var i = 0; i < default_acl.length; i++) {
      var study = default_acl[i]['study'];
      var subject = default_acl[i]['subject'];
      if (study in stars && stars[study].indexOf(subject) > -1) {
        starred_acl.push(default_acl[i]);
      } else {
        unstarred_acl.push(default_acl[i]);
      }
    }
    this.setState({
      acl: starred_acl.concat(unstarred_acl)
    });
  }
  checkComplete = (complete, cellData) => {
    var study = (cellData['rowData']['study'] in this.state.complete);
    if (study) {
      var subject = this.state.complete[cellData['rowData']['study']].indexOf(cellData['rowData']['subject']);
      if (subject > -1) {
        return true;
      } else {
        return false;
      }
    } else {
      return false;
    }
  }
  checkStar = (star, cellData) => {
    var study = (cellData['rowData']['study'] in this.state.star);
    if (study) {
      var subject = this.state.star[cellData['rowData']['study']].indexOf(cellData['rowData']['subject']);
      if (subject > -1) {
        return true;
      } else {
        return false;
      }
    } else {
      return false;
    }
  }
  updateUserStars = (star) => {
    let uid = this.props.user.uid;
    let preference = {};
    preference['star'] = star ? star : this.state.star;
    preference['complete'] = this.state.complete;
    preference['config'] = 'config' in this.state.preferences ? this.state.preferences['config'] : '';
    return fetch('/api/v1/users/' + uid + '/preferences', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      credentials: 'same-origin',
      body: JSON.stringify({
        preferences: preference
      })
    }).then(() => {
      return;
    });
  }
  updateUserComplete = (complete) => {
    let uid = this.props.user.uid;
    let preference = {};
    preference['star'] = this.state.star;
    preference['complete'] = complete;
    preference['config'] = 'config' in this.state.preferences ? this.state.preferences['config'] : '';
    return fetch('/api/v1/users/' + uid + '/preferences', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      credentials: 'same-origin',
      body: JSON.stringify({
        preferences: preference
      })
    }).then(() => {
      return;
    });
  }
  handleResize = () => {
    this.setState({
      width: window.innerWidth - this.state.marginWidth,
      height: window.innerHeight - this.state.marginHeight
    })
  }
  // eslint-disable-next-line react/no-deprecated
  async componentWillMount() {
    try {
      const acl = await fetchSubjects();
      this.autocomplete(this.aggregateSubjects(acl), acl)
      this.fetchUserPreferences(this.props.user.uid);
    } catch (err) {
      console.error(err.message);
    }
  }
  sort = ({ sortBy, sortDirection }) => {
    const sortedList = this.sortList({ sortBy, sortDirection })
    this.setState({
      sortBy: sortBy,
      sortDirection: sortDirection,
    })
    this.starAcl(sortedList, this.state.star)
  }
  sortList = ({ sortBy, sortDirection }) => {
    let list = _.map(this.state.acl, _.clone)
    return _.orderBy(list, [sortBy], sortDirection.toLowerCase())
  }
  rowClassName = ({ index }) => {
    if (index < 0) {
      return 'headerRow'
    } else {
      return index % 2 === 0 ? 'evenRow' : 'oddRow'
    }
  }
  handleDrawerToggle = () => {
    this.setState(state => ({ mobileOpen: !state.mobileOpen }));
  };
  handleSearch = value => {
    this.setState({
      search: value,
      search_array: value.map(option => option.value)
    });
  };
  handleChange = name => value => {
    this.setState({
      [name]: value,
      acl: _.map(default_acl, _.clone).filter((row) => {
        var key = row.study + row.subject;
        var filter = value.map(f => f.value);
        if (filter.length > 0 && filter.indexOf(key) === -1) {
          return false;
        } else {
          return true;
        }
      })
    });
  };
  componentWillUnmount() {
    window.removeEventListener('resize', this.handleResize);
  }
  aggregateSubjects = (acl) => {
    var options = [];
    for (var study = 0; study < acl.length; study++) {
      Array.prototype.push.apply(options, acl[study].subjects);
    }
    return this.processDates(options)
  }
  processDates = (options) => {
    const momentSetting = {
      sameDay: '[Today]',
      nextDay: '[Tomorrow]',
      nextWeek: 'dddd',
      lastDay: '[Yesterday]',
      lastWeek: '[Last] dddd',
      sameElse: 'MM/DD/YYYY'
    };
    const nowT = moment().local();
    for (var i = 0; i < options.length; i++) {
      var row = options[i];
      var syncedT = moment.utc(row.synced).local();
      var syncedL = moment(syncedT.format('YYYY-MM-DD'))
        .calendar(null, momentSetting);
      var days = nowT.diff(syncedT, 'days');
      var color = days > 14 ? '#de1d16' : '#14c774';
      options[i]['synced'] = syncedL;
      options[i]['lastSyncedColor'] = color;
    }
    return options;
  }
  autocomplete = (options, acl) => {
    autocomplete = options.map(option => ({
      value: option.study + option.subject,
      label: option.subject + ' in ' + option.study
    }));
    default_acl = options;
    this.starAcl(options, this.state.star)
    this.setState({
      totalStudies: acl.length,
      totalSubjects: options.length,
      totalDays: Math.max.apply(Math, options.map(function (o) { return o.days; })),
      default_acl: options
    });
  }
  getStudyCell = (data) => {
    return <a style={{ textDecoration: 'none' }} href={'/dashboard/' + data.study}>{data.study}</a>
  };
  getSubjectCell = (data) => {
    return <a style={{ textDecoration: 'none' }} href={'/dashboard/' + data.study + '/' + data.subject}>{data.subject}</a>
  }
  getSyncedCell = (data) => {
    var complete = this.state.complete;
    if (data.study in complete && complete[data.study].indexOf(data.subject) > -1) {
      return <span>{data.synced}</span>
    } else {
      return <span style={{ color: data.lastSyncedColor }}>{data.synced}</span>
    }
  };
  render() {
    const { classes } = this.props;
    const components = {
      Option, Control,
      NoOptionsMessage, Placeholder,
      SingleValue, MultiValue, IndicatorSeparator,
      ValueContainer, Menu, DropdownIndicator
    };
    return (
      <div className={classes.root}>
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
              className={classes.navIconHide}
            >
              <img width='24px' height='24px' src='/img/favicon.png' />
            </IconButton>
            <div style={{ width: '100%' }}>
              <NoSsr>
                <Select
                  classes={classes}
                  placeholder='Search a study or subject'
                  value={this.state.search}
                  onChange={this.handleSearch}
                  options={autocomplete}
                  autoFocus={true}
                  components={components}
                  isMulti
                />
              </NoSsr>
            </div>
          </Toolbar>
        </AppBar>
        <Sidebar
          avatar={this.state.avatar}
          handleDrawerToggle={this.handleDrawerToggle}
          mobileOpen={this.state.mobileOpen}
          totalDays={this.state.totalDays}
          totalStudies={this.state.totalStudies}
          totalSubjects={this.state.totalSubjects}
          user={this.props.user}
        />
        <main className={classes.content} style={{ padding: 0 }}>
          <div className={classes.toolbar} />
          <div
            className={classes.content}
            style={{
              padding: '12px',
              marginTop: '48px',
            }}
          >
            {this.state.acl.length > 0 ?
              <Table
                width={this.state.width < 960 ? this.state.width : this.state.width - drawerWidth}
                height={this.state.height}
                headerHeight={48}
                headerStyle={{
                  fontFamily: '"Roboto", sans-serif',
                  paddingTop: '24px',
                  height: '48px',
                  color: 'rgba(0, 0, 0, 0.54)',
                  fontWeight: '500',
                  fontSize: '0.75rem'
                }}
                rowStyle={{
                  fontFamily: '"Roboto", sans-serif',
                  height: '40px',
                  fontSize: '0.8125rem',
                  fontWeight: '400',
                  color: 'rgba(0, 0, 0, 0.87)'
                }}
                rowHeight={48}
                rowCount={this.state.search_array.length > 0 ? this.state.search_array.length : this.state.acl.length}
                rowGetter={({ index }) => this.state.acl.filter((row) => {
                  var key = row.study + row.subject;
                  var filter = this.state.search_array;
                  if (filter.length > 0 && filter.indexOf(key) === -1) {
                    return false;
                  } else {
                    return true;
                  }
                })[index]
                }
                rowClassName={this.rowClassName}
                sort={this.sort}
                sortBy={this.state.sortBy}
                sortDirection={this.state.sortDirection}
              >
                <Column
                  label='Subject'
                  dataKey='subject'
                  width={this.state.width / 5}
                  cellRenderer={({ rowData }) => this.getSubjectCell(rowData)}
                />
                <Column
                  label='Study'
                  dataKey='study'
                  width={this.state.width / 5}
                  cellRenderer={({ rowData }) => this.getStudyCell(rowData)}
                />
                <Column
                  label='Last Synced'
                  dataKey='synced'
                  cellRenderer={({ rowData }) => this.getSyncedCell(rowData, 'synced')}
                  width={this.state.width / 5}
                />
                <Column
                  label='Complete'
                  cellRenderer={(cellData) => (
                    <Checkbox
                      className={classes.td}
                      icon={<CheckBoxOutlineBlankIcon />}
                      checkedIcon={
                        <CheckBoxIcon style={{ color: 'rgba(0, 0, 0, 0.54)' }} />
                      }
                      disableRipple={true}
                      checked={this.checkComplete(this.state.complete, cellData)}
                      onChange={(e, checked) => this.handleComplete(e, checked, cellData)}
                    />)
                  }
                  width={this.state.width / 5}
                />
                <Column
                  label='Star'
                  cellRenderer={(cellData) => (
                    <Checkbox
                      className={classes.td}
                      disableRipple={true}
                      icon={<StarBorder />}
                      checkedIcon={
                        <Star style={{ color: '#FFB80A' }} />
                      }
                      checked={this.checkStar(this.state.star, cellData)}
                      onChange={(e, checked) => this.handleStar(e, checked, cellData)}
                    />)
                  }
                  width={this.state.width / 5}
                />
              </Table> : null}
          </div>
        </main>
      </div>
    )
  }
}

const mapStateToProps = (state) => ({
  user: state.user
})

export default compose(
  withStyles(styles, { withTheme: true }),
  connect(mapStateToProps)
)(MainPage);
//export default connect(mapStateToProps)withStyles(styles, { withTheme: true })(MainPage)
