
window.onpopstate = function(event) {
    console.log(`onpopstate: ${event.state.page}`);
	const page = event.state.page;
    if (page[0] != '@'){
        LoadPage({page : page});
    }else{
        LoadPage({page : page});
    }
	
}
function LoadPage(props) { 
    if(props.page_number === undefined) props.page_number = 1;
    console.log(`Page: ${props.page}, Page number: ${props.page_number}`);
    const authenticated = document.querySelector('#network').dataset.user;
    const username = document.querySelector('#network').dataset.username;
    if (props.page === 'all' && authenticated === 'True'){
        ReactDOM.render(
            <div>
                <h5 className='txr'>Hi @{username} ! Share your thoughts.</h5>
                <PostForm user={username}/>
            </div>, document.querySelector('#new-post'));
    }else if (props.page === 'all' && authenticated === 'False'){
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
    //if(props.page[0] != '@' && props.page != 'all') history.pushState({page : `${props.page}` }, '' , `${props.page}`);
    window.scrollTo(0, 0);
    return Data(props.page, props.page_number);
}

/* 
    request posts - filter could be:
    'all' -> get all posts,
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
        }else if (result.posts.length > 0){
            // clear container
            ReactDOM.unmountComponentAtNode(document.querySelector('#load'));
            document.querySelector('#load').innerHTML='';
            // render component
            ReactDOM.render(<LoadPosts posts = {result.posts} info ={result.info}/>, document.querySelector('#load'));
        }else{
           const Message = () => (
                <h5 className = 'm-3' >Nothing here.</h5>
            );
            ReactDOM.unmountComponentAtNode(document.querySelector('#load'));
            ReactDOM.render(<Message />,document.querySelector('#load'));
        }
    });
    return false;
}
function newPost(content) {
    fetch('/api', {
        method: 'POST',
        body: JSON.stringify({
                type: 'new',
                post: content
                //parent: parent_post
            })
    })
    .then(response => response.json())
    .then(result => {
         console.log(result)
        // Result 
        if (result.error != undefined) {
            console.log(`${result.error}`);
            alert(`${result.error}`);
        } else {
            console.log(`${result.message}`);
        }
    });
    return false; 
}
function editPost(content, info){
    fetch('/api', {
        method: 'POST',
        body: JSON.stringify({
                type: 'edit',
                post: content,
                info: info
                //parent: parent_post
            })
    })
    .then(response => response.json())
    .then(result => {
         console.log(result)
        // Result 
        if (result.error != undefined) {
            console.log(`${result.error}`);
            alert(`${result.error}`);
        } else {
            console.log(`${result.message}`);
        }
    });
    return false;
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
        this.handleSubmit = this.handleSubmit.bind(this);
    }

    handleChange(event) {
        this.setState({ value: event.target.value });
    }

    handleSubmit(event) {
        switch(this.type){
            case 'new':
                console.log('new post');
                newPost(this.state.value);
                this.setState({value :'', });
                setTimeout(() => { LoadPage({page : 'all'})}, 500);
                break;
            case 'edit':
                console.log(`information: ${this.props.info}`);
                editPost(this.state.value, this.props.info);
                setTimeout(() => { LoadPage({page : this.props.info.page})}, 500);
                break;
            case 'reply':
                console.log('reply post');
                break;
        }
        event.preventDefault();
    }
    render() {
        let color = 'blue';
        if ((256- this.state.value.length) <0){
            color = 'red';
        }
        return (
            <form onSubmit={this.handleSubmit}>
                <fieldset id="PostForm" style= {color= {color}}>
                    <textarea className="form-control" value={this.state.value} onChange={this.handleChange} 
                        placeholder='What is in your mind?'
                    />
                    <input className="btn post txr mt-2" type="submit" value={this.type != 'edit' ? 'Post': 'Save'} />
                    <span className='float-right'>{256- this.state.value.length}</span>
                </fieldset>
            </form>
        );
    }
}
function Post (props){

    const author = props.post.author;
    const id = props.post.id;
    const sess = document.querySelector('#network').dataset.username;
    let edit = null;
    if (sess === author) {
        edit = (
        <button className='btn btn-light' 
            onClick = {(event) => props.handleEdit(event, id)}>
            Edit
        </button>);
    }
    return (
        <div className="row post m-2">
            <div className="col-2">Avatar</div>
            <div className="col-10">
                <a onClick= {(event) => props.handleProfile(event, author)}>
                    <strong className="txr" >@{author} </strong>
                </a> 
                | <i className = 'txo'>{props.post.timestamp}</i> 
                <div className = 'p-2'>{props.post.content}</div>
            </div>
            {edit}
            <button className = 'btn btn-light' onClick = {(event) => props.handleReply(event, id)}>Reply</button>
            <button className = 'btn btn-light' onClick = {(event) => props.handleLike(event, id)}>&hearts;</button>
        </div>
        
    );
    
} 
class LoadPosts extends React.Component{
    constructor(props){
        super(props);
        this.state={
            posts : this.props.posts,
        };
        this.handleEdit = this.handleEdit.bind(this); 
        this.handleProfile = this.handleProfile.bind(this);
        this.handleProfile = this.handleProfile.bind(this);
        this.handlePage = this.handlePage.bind(this);
    }
    handleEdit(e, id){
        console.log(`still developing edit function... post id: ${id}`);
        let i = this.state.posts.findIndex((elem) => elem.id ===id);
        let copy = this.state.posts;
        console.log(`content: ${this.state.posts[i].content}, index = ${i}`);
        const info = { post_id: id, page : this.props.info.page_name };
        console.log(info);
        copy[i].content = <PostForm type = 'edit' value ={this.state.posts[i].content} info = {info}/>;
        this.setState({
            posts : copy
        });
        e.preventDefault();
    }
    myTest(info){
        console.log(`test result: ${info}`);
    }
    handleLike(e, id){
        //edit content of post function
        //REDIRECT TO FUNCTION to update content on server
        //this.setState({content : this.props.posts.content});
        console.log(`still developing Like function... post id: ${id}`);
        e.preventDefault();
        
    }
    handleProfile(event, author){
        console.log(`need to improve profile function. clicked on ${author}`)
        ReactDOM.unmountComponentAtNode(document.querySelector('#new-post'));
        document.querySelector('#new-post').style.display = 'none';  
        return LoadPage({page : `@${author}`});
    }
    handleReply(e, id){
        console.log(`still developing reply function... post id: ${id}`);
        e.preventDefault();
    }
    handlePage(page){
        const page_name = this.props.info.page_name;
        const next_page = this.props.info.current_page +1;
        const prev_page = this.props.info.current_page -1;
        console.log(`clicked '${page}' on ${page_name}`);
        if(page === 'n' && this.props.info.has_next===true)
            return Data(page_name, next_page);
        else if (page === 'p' && this.props.info.has_previous ===true)
            return Data(page_name, prev_page);
        else return console.log('error.. couldnt change page');
    }
    renderPagination(){
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
    render() {
        return (
            <div className='p-lg-5'>
                {this.renderPagination()}
                {this.state.posts.map((post) =>
                    <Post post={post} key={post.id} 
                        handleEdit={this.handleEdit} 
                        handleProfile={ this.handleProfile }
                        handleReply={ this.handleReply}
                        handleLike={ this.handleLike}
                    />
                )}
                {this.renderPagination()}
            </div>
        );
    }
}

class Profile extends React.Component{
    constructor(props){
        super(props);
        //console.log(`$profile posts: ${this.props.posts}`);
        console.log(`profile: ${this.props.profile}`);
        this.sess = document.querySelector('#network').dataset.username; 
        this.state = {
            follow: Boolean(this.props.profile.followers.find((elem) => elem === this.sess)),
            btnval: null,
        };
        this.state.btnval = this.state.follow ? 'Unfollow':'Follow';
        this.btn = null;
        this.handleClick = this.handleClick.bind(this);
    }
  
    handleClick(event){
        fetch(`/follow/@${this.props.profile.username}`, {
			method: 'PUT'
		})
        .then(response => response.json())
	    .then(message =>{
            console.log(message);
            this.setState( state => ({ 
                follow : !state.follow,
                btnval : !state.follow ? 'Unfollow' : 'Follow',
            })); 
        });
        event.preventDefault();
    }

    render(){
        console.log(`render: ${this.state.follow ? 'Unfollow' : 'Follow'}`);
        if (this.sess != this.props.profile.username){
            this.btn = (
                <button className = 'btn post ml-4' value={this.state.btnval} onClick = {(event) => this.handleClick(event)}> 
                    {this.state.btnval}
                </button>);
        }else this.btn = null;
        
        return( 
        <div>
            <div className='row'>
                <div className = 'col-2'>PIC</div>
                <div className = 'col-10 tro'>
                    <h3 className = 'txr mb-2 mt-2'>@{this.props.profile.username}{this.btn}</h3>
                    <div className = 'ml-3'>
                        <p>User BIO</p>
                        <p>Joined on {this.props.profile.date_joined} </p>
                        Following: <a href='#'>{this.props.profile.following.length} </a>
                        | Followers: <a href='#'>{this.props.profile.followers.length}</a>
                        
                    </div>
                        
                </div>
            </div>
            <LoadPosts posts = {this.props.posts} info= {this.props.info}/>
        </div>
        );
    }
}
document.addEventListener('DOMContentLoaded', DOMLoaded()); 

function DOMLoaded(){ 

    // event listeners for buttons in navbar to redirect to appropriate page on click
    document.querySelector('#all').addEventListener('click', () => LoadPage({page:'all'}) );

    // if user is not authenticated these should be ignored
    if (document.querySelector('#network').dataset.user != 'False') {
        document.querySelector('#follow').addEventListener('click', () => {
            ReactDOM.unmountComponentAtNode(document.querySelector('#new-post'));
            document.querySelector('#new-post').style.display = 'none';
            LoadPage({page:'following'}) 
        });
        document.querySelector('#profile').addEventListener('click', () => {
            const user = document.querySelector('#network').dataset.username;
            ReactDOM.unmountComponentAtNode(document.querySelector('#new-post'));
            document.querySelector('#new-post').style.display = 'none';
            LoadPage({page: `@${user}`});
        });
    }
    // load page with all posts by default
    LoadPage({page:'all'});
}
