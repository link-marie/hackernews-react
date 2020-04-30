import React, { Component } from 'react'
import { Mutation } from 'react-apollo'
import gql from 'graphql-tag'

import { AUTH_TOKEN, USER_ID } from '../constants'
import { timeDifferenceForDate } from '../utils'

// Vote実行
const VOTE_MUTATION = gql`
  mutation VoteMutation($linkId: ID!) {
    vote(linkId: $linkId) {
      id
      link {
       id
        votes {
          id
          user {
            id
          }
        }
      }
      user {
        id
      }
    }
  }
`

const UNVOTE_MUTATION = gql`
  mutation UnvoteMutation($linkId: ID!, $voteId: ID!) {
    unvote(linkId: $linkId, voteId: $voteId) {
      id
      votes{
        id
        user {
          id
        }
      }
    }
  }
`

class Link extends Component {

  render() {

    const authToken = localStorage.getItem(AUTH_TOKEN)
    const myVoteId = this.isMyVote()

    const MutationVote = (props) => {
      return (
        <Mutation 
          // GraphQL AST
          mutation={VOTE_MUTATION}

          // GraphQLの変数
          variables={{linkId: this.props.link.id}}
          // Serverが応答を返した直後に呼び出される
          // store: 現在のキャッシュ
          // data: mutation成果
          update={(store, {data: {result}}) =>
            this.props.updateStoreAfterVote(store, result.link.votes, this.props.link.id)
          }
        >
          { /* RenderPropFunction の定義 
            clickで関数を呼び出せるようにする
          */}
          {voteMutation => (
            <div className="ml1 gray f11" onClick={voteMutation}>
              ▲
            </div>
          )}
        </Mutation>
      )
    }

    const MutationUnvote = (props) => {
      return (
        <Mutation 
        mutation={UNVOTE_MUTATION}
        variables={{linkId: this.props.link.id, voteId: myVoteId}}
        update={(store, {data: {result}}) =>
          this.props.updateStoreAfterUnvote(store, result.votes, this.props.link.id)
        }
        >
        {unvoteMutation => (
          <div className="ml1 gray f11" onClick={unvoteMutation}>
            ▼
          </div>
        )}
      </Mutation>
      )
    }

    function ButtonVote(){
      if( !authToken) {
        return ""
      }
      if( myVoteId){
        return <MutationUnvote></MutationUnvote>
      }
      return <MutationVote></MutationVote>
    }

    return (
      <div className="flex mt2 items-start">
        <div className="flex items-center">

          { /* Index */}
          <span className="gray" onClick={this.test01(this.props.index + 1)} >{this.props.index + 1}.</span>

          { /* Vote button */}
          <ButtonVote />
        </div>

        <div className="ml1">

          {/* Link情報 */}
          <div>
            {this.props.link.description} ({this.props.link.url})
          </div>

          <div className="f6 lh-copy gray">
            {/* Vote数 */}
            {this.props.link.votes.length} votes

            | by{' '}

            {/* 投稿者 */}
            {this.props.link.postedBy
              ? this.props.link.postedBy.name
              : 'Unknown'}{' '}

            {/* 投稿経過時間 */}
            {timeDifferenceForDate(this.props.link.createdAt)}
          </div>
        </div>
      </div>
    )
  }

  test01(idx) {
    // console.log(" test01: " + idx)
  }

  isMyVote() {
    const votes = this.props.link.votes
    const userId = localStorage.getItem(USER_ID)

   let voteId = null
   for( var i = 0; i < votes.length; i++){
     let vote = votes[ i]
     let user = vote.user
     if( user){
      if( userId === user.id){
        voteId = vote.id
      }
    }
   }

    return voteId
  }
}

export default Link
