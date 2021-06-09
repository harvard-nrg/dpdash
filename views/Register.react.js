import React, { Component } from 'react';
import { render } from 'react-dom';
import { connect } from 'react-redux';

import Card from '@material-ui/core/Card';
import CardContent from '@material-ui/core/CardContent';
import CardMedia from '@material-ui/core/CardMedia';
import Typography from '@material-ui/core/Typography';
import TextField from '@material-ui/core/TextField';
import Button from '@material-ui/core/Button';
import Snackbar from '@material-ui/core/Snackbar';

class RegisterPage extends Component {
  constructor(props) {
    super(props);
    this.state = {
      message: '',
      username: '',
      password: '',
      email: '',
      fullname: '',
      confirmpw: '',
      unmatched: false,
      unInitialized: false,
      fnInitialized: false
    };
  }
  componentDidUpdate() {
  }
  handleClick = () => {
    this.setState({
      open: true,
    });
  };
  handleRequestClose = () => {
    this.setState({
      open: false,
    });
  };
  handleChange = prop => event => {
    if (prop === 'fullname' && !this.state.fnInitialized) {
      this.setState({
        [prop]: event.target.value,
        fnInitialized: true
      });
      return;
    } else if (prop === 'username' && !this.state.unInitialized) {
      this.setState({
        [prop]: event.target.value,
        unInitialized: true
      });
      return;
    }
    this.setState({ [prop]: event.target.value });
  };
  handleMouseDownPassword = event => {
    event.preventDefault();
  };
  componentDidMount() {
    console.log('update');
  }
  componentWillMount() {
    console.log('will mount');
    if (this.props.user.message.length > 0) {
      this.setState({
        open: true
      });
    }
    /* Resize listener register */
    window.addEventListener('resize', this.handleResize)
  }
  componentWillUnmount() {
    window.removeEventListener('resize', this.handleResize);
  }
  handleResize = (event) => {
    this.setState({
      windowWidth: window.innerWidth
    });
  };
  checkEmail = event => {
    let emailPattern = /[a-z0-9._%+-]+@[a-z0-9.-]+\.[a-z]{2,4}$/;
    let invalidEmail = event.target.value.match(emailPattern);
    this.setState({
      invalidEmail: !invalidEmail
    });
  };
  openWindow = (uri) => {
    window.open(uri, '_self');
  };
  confirmPassword = event => {
    let unmatched = (event.target.value === this.state.password) ? false : true;
    this.setState({
      confirmpw: event.target.value,
      unmatched: unmatched
    });
  };
  render() {
    return (
      <div>
        <Card
        >
          <div
            style={{
              display: 'flex',
              maxWidth: 600
            }}
          >
            <div
              style={{
                display: 'flex',
                flexDirection: 'column'
              }}
            >
              <CardContent
                style={{
                  flex: '1 0 auto'
                }}
              >
                <Typography
                  variant="title"
                  style={{
                    marginTop: '8px',
                    marginBottom: '8px'
                  }}
                >
                  Welcome to DPdash!
                            </Typography>
                <Typography variant="subheading" color="textSecondary">
                  Please create your DPdash account to continue.
                            </Typography>
              </CardContent>
              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  paddingTop: '4px',
                  paddingLeft: '12px',
                  paddingBottom: '4px',
                  paddingRight: '12px'
                }}
              >
                <div
                  style={{
                    width: '100%',
                    paddingTop: '4px',
                    paddingLeft: '12px',
                    paddingBottom: '12px',
                    paddingRight: '12px'
                  }}
                >
                  <form
                    action="/signup"
                    method="post"
                    id="signupForm"
                  >
                    <TextField
                      id='username'
                      name='username'
                      type='text'
                      label='Username'
                      value={this.state.username}
                      onChange={this.handleChange('username')}
                      autoFocus={true}
                      required={true}
                      fullWidth={true}
                      margin="normal"
                      error={(this.state.unInitialized && this.state.username.length === 0) ? true : false}
                    />
                    <br />
                    <TextField
                      id='password'
                      name='password'
                      type='password'
                      value={this.state.password}
                      onChange={this.handleChange('password')}
                      label='Password'
                      required={true}
                      margin="normal"
                      fullWidth={true}
                      error={this.state.unmatched}
                    />
                    <br />
                    <TextField
                      id='confirmpw'
                      name='confirmpw'
                      type='password'
                      value={this.state.confirmpw}
                      onChange={this.confirmPassword}
                      label='Confirm Password'
                      required={true}
                      margin="normal"
                      fullWidth={true}
                      error={this.state.unmatched}
                      disabled={this.state.password.length === 0 ? true : false}
                    />
                    <br />
                    <TextField
                      id='fullname'
                      name='display_name'
                      type='text'
                      label='Full Name'
                      value={this.state.fullname}
                      onChange={this.handleChange('fullname')}
                      required={true}
                      fullWidth={true}
                      margin="normal"
                      error={(this.state.fnInitialized && this.state.fullname.length === 0) ? true : false}
                    />
                    <br />
                    <TextField
                      type="email"
                      name="email"
                      value={this.state.email}
                      onChange={this.handleChange('email')}
                      onBlur={this.checkEmail}
                      required={true}
                      fullWidth={true}
                      margin="normal"
                      id='email'
                      label='Email'
                      error={this.state.invalidEmail}
                    />
                  </form>
                </div>
              </div>
            </div>
            {this.state.windowWidth < 620 ? null :
              <CardMedia
                style={{
                  width: '250px',
                  margin: '50px',
                  backgroundImage: 'url("/img/dpdash.png")',
                  backgroundSize: 'contain',
                  backgroundRepeat: 'no-repeat',
                  backgroundPosition: 'center center'
                }}
                title="DPdash"
              />
            }
          </div>
          <div
            style={{
              padding: '12px',
              float: 'right'
            }}
          >
            <Button
              color="primary"
              onClick={() => this.openWindow('/login')}
              style={{
                paddingTop: '11px',
                color: '#5790bd'
              }}
            >
              Cancel
            </Button>
            <Button
              variant="outlined"
              type="submit"
              form="signupForm"
              style={{
                borderColor: '#5790bd',
                paddingTop: '11px',
                color: '#ffffff',
                backgroundColor: '#5790bd',
                marginLeft: '12px'
              }}
            >
              Submit
            </Button>
          </div>
        </Card>
        <Snackbar
          open={this.state.open}
          message={this.props.user.message}
          autoHideDuration={4000}
          onClose={this.handleRequestClose}
        />
      </div>
    );
  }
}
const mapStateToProps = (state) => ({
  user: state.user
});

export default connect(mapStateToProps)(RegisterPage);
