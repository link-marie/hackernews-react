import React, { Component } from 'react'
import { Link } from 'react-router-dom'
import { withRouter } from 'react-router'
import { AUTH_TOKEN } from '../constants'

// 画面切り替えボタンを配置する画面ヘッダー領域
// それぞれの routeに linkする
class Header extends Component {

  render() {
    // 内部メモリよりtoken読み込み
    const authToken = localStorage.getItem(AUTH_TOKEN)

    return (
      <div className="flex pa1 justify-between nowrap orange">
        <div className="flex flex-fixed black">
          <div className="fw7 mr1">HackerNews</div>

          {/* 新規投稿ページ */}
          <Link to="/" className="ml1 no-underline black">
            new
          </Link>

          <div className="ml1">|</div>

          {/* Top10 votes */}
          <Link to="/top" className="ml1 no-underline black">
            top
          </Link>

          <div className="ml1">|</div>

          {/* Search */}
          <Link to="/search" className="ml1 no-underline black">
            search
          </Link>

          {/* 投稿 */}
          {authToken && (
            <div className="flex">
              <div className="ml1">|</div>
              <Link to="/create" className="ml1 no-underline black">
                submit
            </Link>
            </div>
          )}

        </div>

        <div className="flex flex-fixed">

          {/* Login状態? */}
          {authToken ? (

            // LogOut
            <div
              className="ml1 pointer black"
              onClick={() => {
                localStorage.removeItem(AUTH_TOKEN)
                this.props.history.push(`/`)
              }}
            >
              logout
            </div>
          ) : (

              // LogIn
              <Link to="/login" className="ml1 no-underline black">
                login
              </Link>
            )}
        </div>

      </div>
    )
  }
}

export default withRouter(Header)
