import React, { Component } from 'react'
import { AUTH_TOKEN, USER_ID } from '../constants'
import { Mutation } from 'react-apollo'
import gql from 'graphql-tag'

// GraphQL AST 
const SIGNUP_MUTATION = gql`
  mutation SignupMutation($email: String!, $password: String!, $name: String!) {
    signup(email: $email, password: $password, name: $name) {
      token
      user {
        id
      }
    }
  }
`

// tokenが返される
const LOGIN_MUTATION = gql`
  mutation LoginMutation($email: String!, $password: String!) {
    login(email: $email, password: $password) {
      token
      user {
        id
      }
    }
  }
`

class Login extends Component {

  // 内部保存領域
  state = {
    login: true, // switch between Login and SignUp
    email: '',
    password: '',
    name: '',
  }

  render() {
    // 現在の状態を読み込み
    const { login, email, password, name } = this.state

    return (
      <div>
        <h4 className="mv3">{login ? 'Login' : 'Sign Up'}</h4>
        <div className="flex flex-column">
          {/* Singupのときだけ name入力する */}
          {!login && (
            <input
              value={name}
              onChange={e => this.setState({ name: e.target.value })}
              type="text"
              placeholder="Your name"
            />
          )}

          {/* email 入力 */}
          <input
            value={email}
            onChange={e => this.setState({ email: e.target.value })}
            type="text"
            placeholder="Your email address"
          />

          {/* password 入力 */}
          <input
            value={password}
            onChange={e => this.setState({ password: e.target.value })}
            type="password"
            placeholder="Choose a safe password"
          />
        </div>

        <div className="flex mt3">

          {/* loginの時 : LOGIN_MUTATION
              signupの時: SIGNUP_MUTATION
          */}
          <Mutation
              // GraphQL AST
              mutation={login ? LOGIN_MUTATION : SIGNUP_MUTATION}
              // 変数は共通
              variables={{ email, password, name }}
              // Mutationが成功した時に実行する処理。成功した結果 data が返される。
              // dataの構造は server schemaを参照
              onCompleted={data => this._confirm(data)}
            >
              { /* RenderPropFunction の定義 */}
              {funcMutation => (
                <div className="pointer mr2 button" 
                  onClick={funcMutation}>
                  {login ? 'login' : 'create account'}
                </div>
              )}

          </Mutation>

          {/* Login/Sigupの切り替え */}
          <div
            className="pointer button"
            onClick={() => this.setState({ login: !login })}
          >
            {login
              ? 'need to create an account?'
              : 'already have an account?'}
          </div>
        </div>
      </div>
    )
  }

  // Mutationが成功したときの処理
  _confirm = async data => {
    // data propより tokenを取り出す
    const { token, user } = this.state.login ? data.login : data.signup
    this._saveUserData(token, user)
    this.props.history.push(`/`)
  }

  // tokenの保存
  _saveUserData = (token, user) => {
    localStorage.setItem(AUTH_TOKEN, token)
    localStorage.setItem(USER_ID, user.id)
  }
}

export default Login