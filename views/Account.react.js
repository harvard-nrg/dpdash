import React, { Component } from 'react';
import { connect } from 'react-redux';
import 'whatwg-fetch';

import TextField from '@material-ui/core/TextField';
import Button from '@material-ui/core/Button';
import Tooltip from '@material-ui/core/Tooltip';
import ButtonBase from '@material-ui/core/ButtonBase';
import Snackbar from '@material-ui/core/Snackbar';

import { compose } from 'redux';
import { withStyles } from '@material-ui/core/styles';

import Header from './components/Header';
import Sidebar from './components/Sidebar';

import getAvatar from './fe-utils/avatarUtil';
import getCounts from './fe-utils/countUtil';
import { fetchSubjects } from './fe-utils/fetchUtil';

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
    marginTop: '64px',
  }
});

class AccountPage extends Component {
  constructor(props) {
    super(props);
    this.state = {
      user: {},
      _id: '',
      uid: '',
      display_name: '',
      title: '',
      department: '',
      company: '',
      mail: '',
      ldap: '',
      icon: '',
      totalStudies: 0,
      totalSubjects: 0,
      totalDays: 0,
      snackTime: false,
      mobileOpen: false
    };
  }
  componentDidUpdate() {
  }
  // eslint-disable-next-line react/no-deprecated
  async componentWillMount() {
    try {
      const acl = await fetchSubjects();
      this.setState(getCounts({ acl }));
      this.fetchUserInfo(this.props.user.uid);
      this.setState({
        user: this.props.user
      });
    } catch (err) {
      console.error(err.message);
    }
  }
  componentDidMount() {
  }
  componentWillUnmount() {
  }
  handleDrawerToggle = () => {
    this.setState(state => ({ mobileOpen: !state.mobileOpen }));
  };
  fetchUserInfo = (uid) => {
    return window.fetch('/api/v1/users/' + uid, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json'
      },
      credentials: 'same-origin'
    }).then((response) => {
      if (response.status !== 200) {
        return;
      }
      return response.json();
    }).then((response) => {
      this.setState({
        _id: response['_id'],
        uid: response['uid'],
        display_name: response['display_name'],
        title: response['title'],
        department: response['department'],
        company: response['company'],
        mail: response['mail'],
        ldap: response['ldap'],
        icon: response['icon']
      });
    });
  }
  handleChange = (event, key) => {
    this.setState({
      [key]: event.target.value,
    });
  };
  editUserInfo = () => {
    let uid = this.state.uid;
    let user = {};
    user['uid'] = uid;
    user['display_name'] = this.state.display_name;
    user['title'] = this.state.title;
    user['department'] = this.state.department;
    user['company'] = this.state.company;
    user['mail'] = this.state.mail;
    user['icon'] = this.state.icon;

    return window.fetch('/api/v1/users/' + uid, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      credentials: 'same-origin',
      body: JSON.stringify({
        user: user
      })
    }).then((response) => {
      return response;
    }).then(data => {
      this.setState({
        snackTime: true
      });
      return data;
    }).catch(error => {
      return error;
    });
  }
  scaleDownImage = () => {
    let image = this.refs.userSubmittedAvatar;
    let canvas = this.refs.canvas;
    let ctx = canvas.getContext('2d');

    canvas.height = 200;
    canvas.width = 200;

    let sx = 0;
    let sy = (image.naturalHeight - image.naturalWidth) / 2;
    let swidth = image.naturalWidth;
    let sheight = image.naturalWidth;

    if (image.naturalHeight < image.naturalWidth) {
      sy = 0;
      sx = (image.naturalWidth - image.naturalHeight) / 2;
      swidth = image.naturalHeight;
      sheight = image.naturalHeight;
    }

    let x = 0;
    let y = 0;

    ctx.drawImage(image, sx, sy, swidth, sheight, x, y, 200, 200);

    let dataURL = canvas.toDataURL('image/png');
    this.setState({ icon: dataURL }, () => {
      this.editUserInfo();
      ctx.clearRect(0, 0, canvas.width, canvas.height);
    });
  }
  handleChangeIcon = (event) => {
    let accepted_files = event.target.files;
    if (accepted_files.length > 0) {
      let reader = new FileReader();
      reader.readAsDataURL(accepted_files[0]);
      reader.onload = (e) => {
        this.setState({
          baseURL: e.target.result
        });
      };
    }
  }
  handleCrumbs = () => {
    this.setState({
      snackTime: false
    });
  }
  render() {
    const { classes } = this.props;
    return (
      <div className={classes.root}>
        <Header 
          title="Account"
          isAccountPage
          handleDrawerToggle={this.handleDrawerToggle}
        />
        <Sidebar
          avatar={getAvatar({ user: { icon: this.state.icon, name: this.state.display_name, uid: this.state.uid }})}
          handleDrawerToggle={this.handleDrawerToggle}
          mobileOpen={this.state.mobileOpen}
          totalDays={this.state.totalDays}
          totalStudies={this.state.totalStudies}
          totalSubjects={this.state.totalSubjects}
          user={{ ...this.state.user, name: this.state.display_name }}
        />
        <div
          className={classes.content}
          style={{
            height: '100%',
            padding: '12px',
            overflow: 'scroll'
          }}
        >
          <div
            style={{
              width: '100%',
              marginBottom: '12px'
            }}
          >
            <input
              accept="image/*"
              id="raised-button-file"
              multiple
              type="file"
              style={{ display: 'none' }}
              onChange={this.handleChangeIcon}
            />
            <label htmlFor="raised-button-file">
              <ButtonBase
                component="span"
                style={{
                  width: '100%',
                  margin: '0 auto'
                }}
                focusRipple
              >
                <Tooltip title="Edit Profile Photo">
                  {getAvatar({ user: { icon: this.state.icon, name: this.state.display_name, uid: this.state.uid }})}
                </Tooltip>
              </ButtonBase>
            </label>
          </div>
          <TextField
            style={{
              marginTop: '8px',
              marginBottom: '8px'
            }}
            label="Full Name"
            name="display_name"
            value={this.state.display_name}
            onChange={(e) => this.handleChange(e, 'display_name')}
            fullWidth={true}
          />
          <TextField
            style={{
              marginTop: '8px',
              marginBottom: '8px'
            }}
            label="Email"
            type="email"
            pattern="[a-z0-9._%+-]+@[a-z0-9.-]+\.[a-z]{2,4}$"
            name="email"
            value={this.state.mail}
            fullWidth={true}
            onChange={(e) => this.handleChange(e, 'mail')}
          />
          <TextField
            style={{
              marginTop: '8px',
              marginBottom: '8px'
            }}
            label="Title"
            name="title"
            value={this.state.title}
            fullWidth={true}
            onChange={(e) => this.handleChange(e, 'title')}
          />
          <TextField
            style={{
              marginTop: '8px',
              marginBottom: '8px'
            }}
            label="Department"
            name="department"
            value={this.state.department}
            fullWidth={true}
            onChange={(e) => this.handleChange(e, 'department')}
          />
          <TextField
            style={{
              marginTop: '8px',
              marginBottom: '8px'
            }}
            label="Company"
            name="company"
            value={this.state.company}
            fullWidth={true}
            onChange={(e) => this.handleChange(e, 'company')}
          />
          <div
            style={{
              textAlign: 'right'
            }}
          >
            <Button
              variant="outlined"
              type="submit"
              onClick={this.editUserInfo}
              style={{
                borderColor: '#5790bd',
                paddingTop: '11px',
                color: '#ffffff',
                backgroundColor: '#5790bd',
                marginLeft: '12px'
              }}
            >
              Save
            </Button>
          </div>
        </div>
        <Snackbar
          open={this.state.snackTime}
          message="Your account has been updated."
          autoHideDuration={2000}
          onRequestClose={this.handleCrumbs}
        />
        <img
          style={{
            display: 'none'
          }}
          ref="userSubmittedAvatar"
          onLoad={this.scaleDownImage}
          src={this.state.baseURL}
        />
        <canvas ref="canvas" style={{ display: 'none' }}></canvas>
      </div>
    );
  }
}

const mapStateToProps = (state) => ({
  user: state.user
});

export default compose(
  withStyles(styles, { withTheme: true }),
  connect(mapStateToProps)
)(AccountPage);
