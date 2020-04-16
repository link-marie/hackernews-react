import React, { Component } from 'react'
import { Mutation } from 'react-apollo'
import gql from 'graphql-tag'
import { FEED_QUERY } from './LinkList'
import { LINKS_PER_PAGE } from '../constants'

// GraphQL AST
const POST_MUTATION = gql`
  mutation PostMutation($description: String!, $url: String!) {
    post(description: $description, url: $url) {
      id
      createdAt
      url
      description
    }
  }
`

class CreateLink extends Component {

  // 内部記憶領域の定義
  state = {
    description: '',
    url: '',
  }

  render() {
    // 内部 state
    const { description, url } = this.state
    return (
      // 投稿入力領域
      <div>
        <div className="flex flex-column mt3">
          <input
            className="mb2"
            value={description}
            onChange={e => this.setState({ description: e.target.value })}
            type="text"
            placeholder="A description for the link"
          />
          <input
            className="mb2"
            value={url}
            onChange={e => this.setState({ url: e.target.value })}
            type="text"
            placeholder="The URL for the link"
          />
        </div>

        {/* 
          POST_MUTATIONを prop 'mutation' として <Mutation />に与える 
        */}
        <Mutation 
          // GraphQL AST or DocumentNode
          mutation={POST_MUTATION} 
          // 変数
          variables={{ description, url }}

          // 新規投稿内容を内部キャッシュに反映
          // Serverが応答を返した直後に呼び出される
          // store: 現在のキャッシュ
          // data: mutation成果
          update={ (store, {data: {post}}) => {
            this.postUpdate(store, post)
          }}

          // Mutationが成功した時に実行する処理
          onCompleted={ 
            () => {
              this.postCompleted()
            }
          }
         >

          { /* RenderPropFunction の定義 */}
          { (funcMutation) => (
            // 投稿ボタン
            <button onClick={
              funcMutation
              }>
              Submit
            </button>
          )}
        </Mutation>
      </div>
    )
  }

  postUpdate(store, post){

    const first = LINKS_PER_PAGE
    const skip = 0
    const orderBy = 'createdAt_DESC'

    // 現在のCacheから 内部データを読み込む
    const data = store.readQuery({
      query: FEED_QUERY,
      variables: { first, skip, orderBy }
    })
    // 投稿を最初に追加
    data.feed.links.unshift(post)
    // 内部Cacheを更新
    store.writeQuery({
      query: FEED_QUERY,
      data,
      variables: { first, skip, orderBy }
    })

    // console.log('post update')
  }

  postCompleted(){
    this.props.history.push('/new/1')
    // console.log('postCompleted')
  }

}

export default CreateLink
