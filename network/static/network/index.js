/*
File not in use (prev version for backup).
*/
window.onpopstate = function(event) {
    if(event.state){
        console.log(`onpopstate: ${event.state.page}`);
        const page = event.state.page;
        const page_number = event.state.number;
        //if (event.state.number != undefined) LoadPage({page : page, page_number : event.state.number});
        //else 
        LoadPage({page : page, page_number: page_number});
    }
}

function LoadPage(props) { 
    if(props.page_number === undefined) props.page_number = 1;
    console.log(`Page: ${props.page}, Page number: ${props.page_number}`);
    const authenticated = document.querySelector('#network').dataset.user;
    const username = document.querySelector('#network').dataset.username;
    if (props.page === 'homepage' && authenticated === 'True'){
        ReactDOM.render(
            <div>
                <h5 className='txr'>Hi @{username} ! Share your thoughts.</h5>
                <PostForm user={username} info = {props}/>
            </div>, document.querySelector('#new-post'));
    }else if (props.page === 'homepage' && authenticated === 'False'){
        const  Note = () =>{
            return (
                <div className = "m-4 text-right">
                    <h3 className= "pr-5"><a href="/login">Log in</a> to share your thoughts.</h3>
                </div>
            );
        }
        ReactDOM.render(
            <Note />, document.querySelector('#new-post'));
    }
    window.scrollTo(0, 0);
    return Data(props.page, props.page_number);
}
async function getData(filter, page_number){
    if (page_number === undefined) page_number = 1;
    console.log(`inside getData, following props: filter = ${filter}, page_number = ${page_number}`);
    let response = await fetch(`/api/${filter}?page=${page_number}`);
    if (response.status==200) console.log(`getData fetched API`);
    else console.log(`getData failed to fetch`);
    let result = await response.json();
    if(result.error){
        console.log(result.error);
        throw new Error(`${result.error} Status: ${response.status}`);
    }else{
        console.log(result);
    }
    return result;
} 
/* 
    fetch posts - filter could be:
    'homepage' -> get all posts,
    'following' -> get posts from users that request.user follows
    '@username' -> get profile from specified user
*/
function Data(filter, page_number) {
    if (page_number === undefined) page_number = 1;
    console.log(`fetch: ${filter}, page: ${page_number}`);
    fetch(`/api/${filter}?page=${page_number}`)
    .then(response => response.json())
    .then(result => { 
        console.log(result);
        if (result.error != undefined) {
            console.log(`${result.error}`);
            alert(`${result.error}`);            
        } else if (filter[0]==='@'){
            ReactDOM.unmountComponentAtNode(document.querySelector('#load'));
            document.querySelector('#load').innerHTML='';
            ReactDOM.render(
            <Profile 
                profile = {result.profile} 
                info = {result.info} 
                posts = {result.posts}
                
            />, document.querySelector('#load'));
        }else {
            // clear container
            ReactDOM.unmountComponentAtNode(document.querySelector('#load'));
            document.querySelector('#load').innerHTML='';
            // render component
            ReactDOM.render(<LoadPosts posts = {result.posts} info ={result.info}/>, document.querySelector('#load'));
        }
    });
    return false;
}
async function update(type, id){
    const csrftoken = Cookies.get('csrftoken');
    const request = new Request(
        '/api/update',
        {headers: {'X-CSRFToken': csrftoken}}
    );
    let response = await fetch(request, {
        method: 'PUT',
        mode: 'same-origin',
        body: JSON.stringify({
            type: type,
            id: id,
        })
    });
    let result = await response.json();
    if(result.error){
        console.log(result.error);
        throw new Error(`${result.error} Status: ${response.status}`);
    }else{
        console.log(result.message);
    }
    return result;
}
async function dbPost(type, post, id){
    const csrftoken = Cookies.get('csrftoken');
    console.log(csrftoken);
    console.log(JSON.stringify({
        type: type,
        post: post,
        id: id,
    }));
    const request = new Request(
        '/api',
        {headers: {'X-CSRFToken': csrftoken}}
    );
    if (id === undefined) id = '';
    let response = await fetch(request, {
        method: 'POST',
        mode: 'same-origin',
        body: JSON.stringify({
                type: type,
                post: post,
                id: id,
            })
    });
    let result = await response.json();
    if (result.error){
        console.log(result.error);
        throw new Error(`${result.error} Status: ${response.status}`);
    }else{
        console.log(result.message);
    }
    return result;
}
/* 
    ADD FEATURE TO FORM: disable submit if over limit 
*/ 
class PostForm extends React.Component {
    constructor(props) {
        super(props);
        this.state = { 
            value: this.props.value ? this.props.value : '', 
        };
        this.type = this.props.type ? this.props.type : 'new',
        this.handleChange = this.handleChange.bind(this);
        this.cancelEdit = this.cancelEdit.bind(this);
    }

    handleChange(event) {
        this.setState({ value: event.target.value });
    }

    async handleSubmit(event) {
        if (this.state.value==='') return alert('Error! Post content must not be empty.');
        if (!event) event = window.event;
        event.stopPropagation();
        event.preventDefault();
        await dbPost(this.type, this.state.value, this.props.info.post_id)
        .catch((e) => alert(e));
        if (this.type === 'new') this.setState({value :'', });
        setTimeout(() => { Data(this.props.info.page, this.props.info.page_number )}, 100);
    }
    cancelEdit(e){
        e.preventDefault();
        setTimeout(() => { Data(this.props.info.page, this.props.info.page_number )}, 100);
    }
    render() {
        let color = 'blue';
        if (this.state.value.length > 256){
            color = 'red';
        }
        return (
            <form onSubmit={(event) => this.handleSubmit(event)}>
                <fieldset style= {color= {color}}>
                    <textarea className="form-control" value={this.state.value} onChange={this.handleChange} 
                        placeholder={this.type === 'reply' ? 'Write your reply...' : 'What is in your mind?'}
                        autoFocus={this.type != 'new' ? true : false}
                    />
                    {this.props.type=== 'edit' && <button onClick={(event)=>this.cancelEdit(event)} className='btn post txr mt-2 mr-2'>Cancel</button>}
                    <input className="btn post txr mt-2" disabled={this.state.value.length>256} type="submit" 
                        value={this.type != 'edit' ? 'Post': 'Save'} />
                    <span className='float-right'>{256- this.state.value.length}</span>
                </fieldset>
            </form>
        );
    }
}
function Post (props){
    const sess = document.querySelector('#network').dataset.username;
    if (props.post.type === 'reply'){
        return (
            <div className='m-2 pr-4 pl-4 pb-2'>
                <h5 className='mb-1'><i className="fas fa-reply"></i> Reply</h5>
                <PostForm type = 'reply' info = {props.post.info}/>
            </div>
        );
    }else{
        const author = props.post.author;
        const author_url = `/${author}`
        const id = props.post.id;
        let style=null;
        if(props.post.likes.find(elem => elem === sess)){
            style={backgroundColor: '#c02000', color:'white'};
        }
        const editbtn = (
            <button disabled={typeof props.post.content !='string'} className='btn btn-light btn-sm' title='Edit'
                onClick = {(event) => props.handleEdit(event, id)}>
                <i className="far fa-edit"></i>
            </button>);
       
        const btngroup = (
                <div className="btn-group float-right">
                    {sess===author && editbtn}
                    <button disabled={!sess} className = 'btn btn-light btn-sm' title= {sess? 'Reply':'Log in to reply to this post'} 
                    onClick = {(event) => props.handleReply(event, id)}>
                        <i className="fas fa-reply"></i> {props.post.replies.length}
                    </button>
                    <button disabled={!sess} style={style} className = 'btn btn-light btn-sm' 
                    title={sess ? 'Like' : 'Log in to like this post'} onClick = {(event) => props.handleLike(event, id)}>
                        <span>&hearts;</span> {props.post.likes.length}
                    </button>    
                </div>
        );
    //onClick= {(event) => props.handleProfile(event, author)}
        
        return (
            <div className="row post rounded m-1 p-1 " onClick={ (event) => { if (typeof props.post.content === 'string') props.handlePost(event,id)}} >
                <div className='col-lg-2 col-md-3 col-sm-12' >
                    <img className="rounded-circle avatar" src= {props.post.author_photo} 
                        alt={props.author} height='auto' width='100' />
                </div>
                
                <div className="col">
                    <a href={author_url} className = "txr h5" >
                        @{author}
                    </a> 
                    <i className = 'ml-2 txo'>{props.post.timestamp}</i> 
                    <small><a href='#' onClick={(event) => props.handleOriginal(event, id)} className='ml-1 font-italic text-muted' >
                        {props.post.original ? 'edited' : null}
                    </a></small>
                    <div className='ml-3'><pre>{props.post.content} {btngroup}</pre></div>
                </div>
                
            </div>
        );
    }
} 
function LoadPost(props){
    console.log(`LoadPost props = ${props}`);
    ReactDOM.unmountComponentAtNode(document.querySelector('#new-post'));
    document.querySelector('#new-post').style.display = 'none';
    ReactDOM.unmountComponentAtNode(document.querySelector('#load'));
    ReactDOM.render(<DetailPost post = {props.post} info = {props.info} />, document.querySelector('#load'));
    return false;
}
class LoadPosts extends React.Component{
    constructor(props){
        super(props);
        this.state={
            posts : this.props.posts,
        };
        this.handleEdit = this.handleEdit.bind(this); 
        //this.handleProfile = this.handleProfile.bind(this);
        this.handleLike = this.handleLike.bind(this);
        this.handleReply = this.handleReply.bind(this);
        this.handlePage = this.handlePage.bind(this);
        this.handlePost = this.handlePost.bind(this);
        this.handleOriginal = this.handleOriginal.bind(this);
        this.sess = document.querySelector('#network').dataset.username; 
    }
    handleOriginal(e, id){
        if (!e) e = window.event;
        e.stopPropagation();
        e.preventDefault();
        let i = this.state.posts.findIndex((elem) => elem.id ===id);
        let nstate = this.state.posts.slice();
        // post content is not a string, do nothing 
        if (typeof nstate[i].content != "string") return; 
        const content = nstate[i].content;
        nstate[i].content = 
            <div className = 'text-muted'>
                <h6>Original</h6>
                <p>{nstate[i].original} </p>
                <button className='btn btn-outline-secondary btn-sm' onClick={(event) => {
                    if(!event) event = window.event;
                    event.preventDefault();
                    event.stopPropagation();
                    nstate[i].content = content;
                    this.setState({
                        posts : nstate
                    });
                }}><strong>&times;</strong> Close</button> 
            </div>
        this.setState({
            posts : nstate
        });
    }
    handleEdit(e, id){
        if (!e) e = window.event;
        e.stopPropagation();
        e.preventDefault();
        // get index
        let i = this.state.posts.findIndex((elem) => elem.id ===id);
        let nstate = this.state.posts.slice();
        const info = { post_id: id, page : this.props.info.page_name, page_number: this.props.info.current_page};
        console.log(info);
        // replace content of  the post with postform with value of previous content
        nstate[i].content = <PostForm type = 'edit' value ={this.state.posts[i].content} info = {info}/>;
        this.setState({
            posts : nstate 
        });
        
    }
    async handleLike(e, id){
        if (!e) e = window.event;
        e.stopPropagation();
        e.preventDefault();
        // update post likes on srv 
        await update('like', id)
        .catch((error) => alert(error)); 

        // create copy
        let nstate = this.state.posts.slice();

        // get index of post to be liked/unliked
        let i = this.state.posts.findIndex((elem) => elem.id === id);

        // check if authenticated user already likes the post .. remove if it does, add if it doesnt 
        if (nstate[i].likes.indexOf(this.sess)>=0){
            nstate[i].likes.splice(nstate[i].likes.indexOf(this.sess), 1)
        }
        else nstate[i].likes.push(this.sess);

        // update state (no need to reload Data from srv)
        this.setState({
            posts : nstate
        })
    }/*
    handleProfile(e, author){
        if (!e) e = window.event;
        e.stopPropagation();
        ReactDOM.unmountComponentAtNode(document.querySelector('#new-post'));
        document.querySelector('#new-post').style.display = 'none';
        history.pushState({page : `@${author}`, number: 1}, '' , author);
        return LoadPage({page : `@${author}`});
    }*/
    handleReply(e, id){
        if (!e) e = window.event;
        e.stopPropagation();
        e.preventDefault();
        // set page back to its original state (removing PostForms)
        console.log(`props.posts should not change`)
        this.setState({
            posts : this.props.posts
        });
        let i = this.state.posts.findIndex((elem) => elem.id ===id);
        const info = { post_id: id, page : this.props.info.page_name, page_number: this.props.info.current_page};
        let copy = this.state.posts.slice();
        const post = {
            id: id+100, //key of postform 
            type : 'reply',
            info : info
        };
        console.log(post);
        copy.splice(i+1,0, post);
        console.log(copy);
        this.setState({
            posts:copy,
        });
    }
    handlePage(page){
        const page_name = this.props.info.page_name;
        const next_page = this.props.info.current_page +1;
        const prev_page = this.props.info.current_page -1;
        if(page === 'n' && this.props.info.has_next===true){
            history.pushState({page : page_name, number: next_page}, '' , `?page=${next_page}`);
            return Data(page_name, next_page);
        }
        else if (page === 'p' && this.props.info.has_previous ===true){
            history.pushState({page : page_name, number: prev_page}, '' , `?page=${prev_page}`);
            return Data(page_name, prev_page);
        }      
    }
    renderPagination(){
        if(this.props.posts.length){
            return (
                <ul className="pagination justify-content-center">
                    <li className = {this.props.info.has_previous ? 'page-item' : 'invisible'} >
                        <a className="page-link" 
                            onClick={()=>this.handlePage('p')}>Previous</a></li>
                    <li className="page-item disabled"><a className="page-link"> 
                            Page {this.props.info.current_page} of {this.props.info.num_pages} </a></li>
                    <li className={this.props.info.has_next ? 'page-item' : 'invisible'}>
                        <a className="page-link" 
                            onClick={()=>this.handlePage('n')}>Next</a></li>
                </ul>
            );
        }
        else return null;
    }
    handlePost(e, id){
        e.preventDefault();
        e.stopPropagation();
        let i = this.state.posts.findIndex((elem) => elem.id ===id);
        const post = this.state.posts.find((elem) => elem.id === id);
        console.log(`post id = ${id}, index = ${i}, postDetail = ${post}`);
        return LoadPost({post: post, info:this.props.info}); //LoadPage({page:`post_${id}`});
    }
    renderPosts(){
        if (this.state.posts.length){
            return (
                this.state.posts.map((post) =>
                        <Post post={post} key={post.id} 
                            handleEdit={this.handleEdit} 
                            //handleProfile={ this.handleProfile }
                            handleReply={ this.handleReply}
                            handleLike={ this.handleLike}
                            handlePost={this.handlePost}
                            handleOriginal={this.handleOriginal}
                        />
                    )
            );
        }else{
            return (<h5 className = 'm-3' >No posts.</h5>);
        }
    }   
    render() {
        return (
            <div className='p-lg-5'>
                {this.renderPagination()}
                {this.renderPosts()}
                {this.renderPagination()}
            </div>
        );
    }
}

class Profile extends React.Component{
    constructor(props){
        super(props);
        this.sess = document.querySelector('#network').dataset.username; 
        this.state = {
            follow: Boolean(this.props.profile.followers.find((elem) => elem === this.sess)),
            followers: this.props.profile.followers.length,
        };
        this.handleFollow = this.handleFollow.bind(this);
    }
  
    async handleFollow(){
        await update('follow', this.props.profile.id)
        .catch((e) => alert(e)); 
        this.setState( state => ({ 
            follow : !state.follow,
            followers: state.follow ? state.followers-1 : state.followers+1,
        })); 
    }

    render(){
        let btn = null;
        if (this.sess && this.sess != this.props.profile.username){
            btn = (
                <button className = 'btn post ml-4' 
                    value={this.state.btnval} 
                    onClick = {this.handleFollow}> 
                    {this.state.follow ? 'Unfollow':'Follow'}
                </button>);
        }
        
        return( 
        <div>
            <div className="d-flex flex-row mt-2">
                    <div className = 'p-2'>
                        <img className = 'rounded-circle ' src={this.props.profile.photo} alt={this.props.profile.username} 
                            style={{width: '200px'}}
                        />          
                    </div>
                    <div className = 'ml-2'>
                        <h3 className = 'txr mb-2 mt-2'>@{this.props.profile.username}{btn}</h3>
                        <div className = 'ml-3'>
                            <p className='lead font-weight-normal'>{this.props.profile.bio}</p>
                            <div className='text-muted'>Joined on {this.props.profile.date_joined} </div>
                            Following: <a href='#'>{this.props.profile.following.length} </a>
                            | Followers: <a href='#'>{this.state.followers}</a>
                        </div>
                            
                    </div>
            </div>
            <LoadPosts posts = {this.props.posts} info= {this.props.info}/>
        </div>
        );
    }
}
class DetailPost extends React.Component{
    constructor(props){
        super(props);
        this.state = {
            post : this.props.post,
        };
        this.renderReplies=this.renderReplies.bind(this);
    }
    async getReplies(id, page){
        if (page === undefined) page =1
        let response = await fetch(`http://localhost:8000/api/replies?id=${id}&page=${page}`);
        let result = await response.json()
        if(result.error) console.log(result.error)
        else if (result.message) console.log(result.message)
        return result
    }
    async renderReplies(){
        const ans = await this.getReplies(this.props.post.id)
        .catch((e) => alert(e));
        
        if(ans.replies){
            ReactDOM.render(
                <div className='m-3'>
                    <h4>Replies</h4>
                    <LoadPosts posts = {ans.replies} info ={this.props.info}/>
                </div>,
                document.querySelector('#replies')
            );
        }else {
            ReactDOM.render(
                <h5>No replies</h5>,
                document.querySelector('#replies')
            );
        }
        return false;
    } 
    render(){
        const Replies = () => {this.renderReplies()};
        return(
            <div className='p-2'>
                <Post post={this.state.post} />
                <div className='m-3 p-3'> 
                    <PostForm type = 'reply' info = {this.props.info} />
                </div>
                <div id= 'replies'></div>
                {Replies()}
            </div>
        );
    }
}

document.addEventListener('DOMContentLoaded', DOMLoaded()); 

function DOMLoaded(){ 

    // event listeners for buttons in navbar to redirect to appropriate page on click
    document.querySelector('#all').addEventListener('click', () => LoadPage({page:'homepage'}) );

    // if user is not authenticated these should be ignored
    if (document.querySelector('#network').dataset.user != 'False') {
        document.querySelector('#follow').addEventListener('click', () => {
            history.pushState({page : 'following', number: 1}, '' , 'following');
            ReactDOM.unmountComponentAtNode(document.querySelector('#new-post'));
            document.querySelector('#new-post').style.display = 'none';
            LoadPage({page:'following'}) 
        });
        document.querySelector('#profile').addEventListener('click', () => {
            const user = document.querySelector('#network').dataset.username;
            history.pushState({page : `@${user}`, number: 1}, '' , user);
            ReactDOM.unmountComponentAtNode(document.querySelector('#new-post'));
            document.querySelector('#new-post').style.display = 'none';
            LoadPage({page: `@${user}`});
        });
    }
    // load first page called by server 
    const first = document.querySelector('#load').dataset.firstpage;
    const page_number = document.querySelector('#load').dataset.pnum;
    console.log(`DOM Loaded, page = ${first}, page number = ${page_number}`);
    if (first != 'homepage') document.querySelector('#new-post').style.display = 'none';

    LoadPage({page: first, page_number: page_number});
}
