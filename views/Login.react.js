import React from 'react';
import Card from '@material-ui/core/Card';
import CardContent from '@material-ui/core/CardContent';
import CardMedia from '@material-ui/core/CardMedia';
import Typography from '@material-ui/core/Typography';
import TextField from '@material-ui/core/TextField';
import Visibility from '@material-ui/icons/Visibility';
import VisibilityOff from '@material-ui/icons/VisibilityOff';
import IconButton from '@material-ui/core/IconButton';
import Input from '@material-ui/core/Input';
import InputLabel from '@material-ui/core/InputLabel';
import InputAdornment from '@material-ui/core/InputAdornment';
import FormControl from '@material-ui/core/FormControl';
import Button from '@material-ui/core/Button';
import { connect } from 'react-redux';
import Snackbar from '@material-ui/core/Snackbar';

class LoginPage extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
      message: '',
      username: '',
      password: '',
      showPassword: false,
      open: false
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
  componentWillMount() {
    if (this.props.user.message.length > 0) {
      this.setState({
        open: true
      });
    }

    /* Resize listener register */
    window.addEventListener('resize', this.handleResize)
  }
  handleResize = (event) => {
    this.setState({
      windowWidth: window.innerWidth
    });
  }
  componentWillUnmount() {
    window.removeEventListener('resize', this.handleResize);
  }
  handleChange = prop => event => {
    this.setState({ [prop]: event.target.value });
  };
  handleMouseDownPassword = event => {
    event.preventDefault();
  };
  handleClickShowPassword = () => {
    this.setState(state => ({ showPassword: !this.state.showPassword }));
  };
  render() {
    return (
      <div>
        <Card
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
                Please log in to continue.
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
                  paddingTop: '4px',
                  paddingLeft: '12px',
                  paddingBottom: '12px',
                  paddingRight: '12px'
                }}
              >
                <form action="/login" method="post" id="loginForm">
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
                  />
                  <br />
                  <TextField
                    id='password'
                    name='password'
                    type={this.state.showPassword ? 'text' : 'password'}
                    value={this.state.password}
                    onChange={this.handleChange('password')}
                    label='Password'
                    InputProps={{
                      endAdornment: (
                        <InputAdornment position="end">
                          <IconButton
                            aria-label="Toggle password visibility"
                            onClick={this.handleClickShowPassword}
                            onMouseDown={this.handleMouseDownPassword}
                          >
                            {this.state.showPassword ? <VisibilityOff /> : <Visibility />}
                          </IconButton>
                        </InputAdornment>
                      )
                    }}
                    required={true}
                    margin="normal"
                  />
                </form>
                <br />
                <Typography
                  component="a"
                  href='/resetpw'
                  style={{
                    textAlign: 'right',
                    width: '100%',
                    marginTop: '12px',
                    marginBottom: '12px',
                    color: '#5790bd',
                    textDecoration: 'none'
                  }}
                >
                  Forgot your password?
                </Typography>
                <br />
                <Button
                  variant="outlined"
                  color="primary"
                  type="submit"
                  form="loginForm"
                  style={{
                    float: 'right',
                    marginTop: '12px',
                    color: '#5790bd'
                  }}
                  fullWidth={true}
                >
                  Log In
                </Button>
                <br />
                <Typography
                  component="a"
                  href='/signup'
                  style={{
                    textAlign: 'center',
                    width: '100%',
                    marginTop: '60px',
                    marginBottom: '12px',
                    textDecoration: 'none',
                    fontWeight: 'normal'
                  }}
                >
                  <span>
                    Don't have an account?
                  </span>
                  &nbsp;
                  <span
                    style={{
                      fontWeight: '500',
                      color: '#5790bd'
                    }}
                  >
                    Sign up
                  </span>
                </Typography>
              </div>
            </div>
          </div>
          {this.state.windowWidth < 620 ? null :
            <CardMedia
              style={{
                width: '317px',
                margin: '50px',
                backgroundImage: 'url("/img/dpdash.png")',
                backgroundSize: 'contain',
                backgroundRepeat: 'no-repeat',
                backgroundPosition: 'center center'
              }}
              title="DPdash"
            />
          }
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

export default connect(mapStateToProps)(LoginPage);
