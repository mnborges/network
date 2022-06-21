var page_name = document.querySelector('#load').dataset.firstpage
var page_number = document.querySelector('#load').dataset.pnum

const Link = ReactRouterDOM.Link;
const Route = ReactRouterDOM.Route;
/**
 * 
 * @param {string} type - type of post update ('like' or 'follow')
 * @param {number} id - post id 
 * @returns {Promise} - srv answer
 */
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
/**
 * @param {string} type - type of action to perform, 'reply' or 'new' adds post to database; 'edit' changes existing post 
 * @param {string} post - post content
 * @param {number} id - id of post to be edited or replied to
 * @returns {Promise} - server answer
 */
async function apiPost(type, post, id){
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

/**
 * 
 */
class PostForm extends React.Component {
    constructor(props) {
        super(props);
        this.state = { 
            value: this.props.value ? this.props.value : '', 
        };
        this.type = this.props.type ? this.props.type : 'new',
        this.handleChange = this.handleChange.bind(this);
    }

    handleChange(event) {
        this.setState({ value: event.target.value });
    }

    async handleSubmit(event) {
        if (!event) event = window.event;
        event.stopPropagation();
        event.preventDefault();
        if (this.state.value==='') {
            alert('Error! Post content must not be empty.');
            throw new Error('Empty form.');
        } 
        //console.log(`type: ${this.type}, value: ${this.state.value}, id: ${this.props.info.post_id}`);
        /* //comment to disable posting to database
        await apiPost(this.type, this.state.value, this.props.info.post_id)
        .catch((e) => { 
            alert(e);
            throw new Error(e);
        }); //end comment here */
        
        setTimeout(() => { this.props.submit(this.state.value) }, 100);
        if (this.type === 'new') this.setState({value :'', });
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
                    {this.props.type=== 'edit' && 
                        <button onClick={(event)=>this.props.cancelEdit(event)} 
                            className='btn post txr mt-2 mr-2'>Cancel
                        </button>}
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
    //if(props.type==='main') console.log(props);
    if (props.post.type === 'form'){
        return ( 
            <div className='m-2 pr-4 pl-4 pb-2' ref = {props.post.ref}>
                <h5 className='mb-1'><i className="fas fa-reply"></i> Reply</h5>
                <PostForm type = 'reply' info = {props.post.info}  submit = {props.post.submit} />
            </div>
        );
    }else{
        const {author, id} = props.post;
        let style=null;
        if(props.post.likes.length && props.post.likes.find(elem => elem === sess)) {
            style={backgroundColor: '#c02000', color:'white'}
        };
        const editbtn = (
            <button disabled={typeof props.post.content !='string'} className='btn btn-light btn-sm' title='Edit'
                onClick = {(event) => props.handleOperation(event, id, 'edit')}>
                <i className="far fa-edit"></i>
            </button>);
       
        const btngroup = (
                <div className="btn-group float-right">
                    {sess===author && editbtn}
                    {props.post.is_reply===false && props.type != 'main' &&<button 
                    disabled={!sess} className = 'btn btn-light btn-sm' 
                    title= {sess? 'Reply':'Log in to reply to this post'} 
                    onClick = {(event) => props.handleOperation(event, id, 'reply')}>
                        <i className="fas fa-reply"></i> {props.post.replies.length}
                    </button>}
                    <button disabled={!sess} style={style} className = 'btn btn-light btn-sm' 
                        title={sess ? 'Like' : 'Log in to like this post'} 
                        onClick = {(event) => props.handleOperation(event, id, 'like')}>
                        <span>&hearts;</span> {props.post.likes.length}
                    </button>    
                </div>
        );
        
        return (
            <div className="row post rounded m-1 p-1 " onClick={ (event) => { 
                if (typeof props.post.content === 'string' && props.post.is_reply===false){
                    props.handlePost(event,id)
            }}}>
                <div className='col-lg-2 col-md-3 col-sm-12' >
                    <img className="rounded-circle avatar" src= {props.post.author_photo} 
                        alt={props.author} height='auto' width='100' />
                </div>
                
                <div className="col">
                    <a href={`/${author}`} className = "txr h5" onClick={(e)=> {
                        e.stopPropagation();
                        e.preventDefault();
                        props.handlePage(`@${author}`)
                        }}>
                        { `@${author}` }
                    </a> 
                    <i className = 'ml-2 txo'>{props.post.timestamp}</i> 
                    {props.post.original && 
                        <small><a href='#' onClick={(event) => props.handleOperation(event, id, 'original')} className='ml-1 font-italic text-muted' >
                            edited
                        </a></small>}
                    <div className='ml-3'><pre>{props.post.content} {btngroup}</pre></div>
                </div>
                
            </div>
        );
    }
}
// This can be turned into simple controlled component
class LoadPosts extends React.Component{
    constructor(props){
        super(props);
        this.sess = document.querySelector('#network').dataset.username;
    }
    
    renderPagination(){
        if(this.props.info.num_pages>1){
            return (
                <ul className="pagination justify-content-center">
                    <li className = {this.props.info.has_previous ? 'page-item' : 'invisible'} >
                        <a className="page-link"
                            onClick={()=>this.props.handlePage('p')}>Previous</a></li>
                    <li className="page-item disabled"><a className="page-link"> 
                            Page {this.props.info.current_page} of {this.props.info.num_pages} </a></li>
                    <li className={this.props.info.has_next ? 'page-item' : 'invisible'}>
                        <a className="page-link" 
                            onClick={()=>this.props.handlePage('n')}>Next</a></li>
                </ul>
            );
        }
        else return null;
    }
    renderPosts(){
        if (this.props.posts.length){
            return (
                this.props.posts.map((post) =>
                        <Post post={post} key={post.id}
                            handleOperation = {this.props.handleOperation}
                            handlePost={this.props.handlePost}
                            handlePage={this.props.handlePage}
                        />
                    )
            );
        }else{
            if (!isNaN(parseInt (this.props.info.page_name))) return (<h5 className = 'm-3'>No replies.</h5>)
            else return (<h5 className = 'm-3' >No posts.</h5>);
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
        .catch((e) => {
            alert(e);
            throw new Error(e);
        }); 
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
                    onClick = {this.handleFollow}> 
                    {this.state.follow ? 'Unfollow':'Follow'}
                </button>);
        }
        return( 
            <div className="d-flex flex-row mt-2">
                    <div className = 'p-2'>
                        <img className = 'rounded-circle ' 
                            src={this.props.profile.photo} 
                            alt={this.props.profile.username} 
                            style={{width: '200px'}}
                        />          
                    </div>
                    <div className = 'ml-2'>
                        <h3 className = 'txr mb-2 mt-2'>@{this.props.profile.username}{btn}</h3>
                        <div className = 'ml-3'>
                            <p className='lead font-weight-normal'>{this.props.profile.bio}</p>
                            <div className='text-muted'>Joined on {this.props.profile.date_joined} </div>
                            Following: <a href={`/${this.props.profile.username}/following`}
                             >{this.props.profile.following.length} </a>
                            | Followers: <a href={`/${this.props.profile.username}/followers`}>
                                {this.state.followers}</a>
                        </div>
                            
                    </div>
            </div>
            
        );
    }
}
//note to myself: please use this function to test react router. or do anything else, but try routing
function Test (props){
    return(
        <div>
            <h3>This is my test page.</h3>
            <hr></hr>
            <p>Lorem ipsum dolor sit amet, consectetur adipiscing elit. Proin molestie.</p>
        </div>
    );
}
function OpenPost (props){
    const user = document.querySelector('#network').dataset.username;
    const {post, info} = props;
    console.log(post);
    return(
        <div className='p-2'>
            <Post post={post}
                type = {'main'}
                handleOperation={props.handleOperation}
                handlePost={()=>console.log(post)}
            />
           {user && <div className='m-3 p-3'> 
                <PostForm 
                type = 'reply' 
                info = {Object.assign({}, info, {post_id : post.id})} 
                submit = {props.submitReply} /> 
            </div>}
            {!user && 
                <div className = "p-3 my-3 m-4">
                <h3 className= "pr-5"><a href="/login">Log in</a> and write a reply.</h3>
                </div>}
            {post.replies.length>0 && <h6>Replies</h6>}
        </div>
        
    );
}

class Network extends React.Component {
    constructor(props){
        super(props);
        this.state = {
            page: page_name ? page_name : 'nopage',//document.querySelector('#load').dataset.firstpage,
            error: null,
            isLoaded: false,
            phs: [ // posts history state
                {
                   posts: Array(10).fill(null),
                   info: null,
                }
            ],
            index: 0,
            profile : null,
            roe : false, 
        };
        //username of request user (if logged in)
        this.xsess = document.querySelector('#network').dataset.username;
        this.post_page = null;
        this.handleOp = this.handleOp.bind(this);
        this.handlePage = this.handlePage.bind(this);
        this.handlePost = this.handlePost.bind(this);
        this.replySubmit = this.replySubmit.bind(this);
        this.clearoe = this.clearoe.bind(this);
        this.ref = React.createRef();

        if(this.sess){
            document.querySelector('#follow').addEventListener('click', () => { 
                console.log('clicked follow');
                this.setState({
                    page:'following',
                    isLoaded:false,
                });
                this.fetchData(1);
            });
            document.querySelector('#profile').addEventListener('click', () => {
                console.log('clicked prof');
                this.setState({
                    page:`@${this.sess}`,
                    isLoaded:false,
                });
                this.fetchData(1);
            });
        }
    }
    componentDidMount() {
        console.log('componentDidMount!');
        this.fetchData(page_number ? page_number : 1);
    }
    componentWillUnmount() {
        console.log('componentDidUnmount!')
        window.onpopstate = (e) => {
            console.log(`onpopstate of componentDidUnmount!`);
            console.log(e.state);
        }
      }
    async fetchData(page_number){
        let title = this.state.page;
        if(typeof title === 'number') title= `Post #${title}`;
        else if (title[0]==='@') title=title.substring(1);
        document.querySelector('title').innerHTML = title.charAt(0).toUpperCase()+title.substring(1);
        console.log(`Fetch begin. Page name = ${this.state.page}, number = ${page_number}`);
        const {info} = this.state.phs[this.state.phs.length -1];
        if (info && info.page_name != this.state.page){
            //clear posts history state
            this.setState({
                phs: [ 
                    {
                       posts: Array(10).fill(null),
                       info: null,
                    }
                ],
            })
        }
        console.log(info);
        let response = await fetch(`/api/${this.state.page}?page=${page_number}`);
        if (response.status==200) console.log(`fetched API`);
        else console.log(`failed to fetch`);
        let result = await response.json();
        if(result.error){
            console.log(result.error);
            this.setState({
                isLoaded:true,
                error: result.error,
            });
        }else{
            if(this.state.page[0] != '@') {
                history.pushState({page : this.state.page, number: page_number}, '' , `${this.state.page}`);
            }else history.pushState({page : this.state.page, number: page_number}, '' , `${this.state.page.substring(1)}`);
            console.log(result);
            const {phs} = this.state;
            const arr = phs.concat({posts: result.posts, info: result.info});
            this.setState({
                isLoaded:true,
                phs: arr,
                index: arr.length-1,
                profile : result.profile ? result.profile : null,
            });
        }
    }
    clearoe(){
        const {index} = this.state;
        if (this.state.roe){
            this.state.phs.pop();
            this.setState({
                roe : false,
                index: index-1,
            }); 
        }
        else return;
    }
    async handleOp(e,id,type){
        console.log(`Handle Operation: ${type}`);
        if (!e) e = window.event;
        e.stopPropagation();
        e.preventDefault();
        // remove previous post history if reply or edit is already active
        await this.clearoe();
        const {phs, page, index} = this.state;
        const posts = phs[index].posts.slice();
        const {info} = phs[index];
        const i = posts.findIndex((elem) => elem.id ===id);
        let post;
        // post page is opened
        if(id === page) post = this.post_page;
        // post is inside current phs
        else{
            posts[i] = Object.assign({}, posts[i]); 
            post =posts[i];
        } 
        const {content} = post;
        // take action according to type of operation
        switch (type){
            case 'original':
                // update post content with original post
                post.content = 
                    <div className = 'text-muted'>
                        <h6>Original</h6>
                        <p>{post.original} </p>
                        <button className='btn btn-outline-secondary btn-sm' onClick={(event) => {
                            if(!event) event = window.event;
                            event.preventDefault();
                            event.stopPropagation();
                            post.content = content;
                            if (page != id) {
                                this.clearoe();
                                this.setState({
                                    index:index,
                                });
                            }
                            else this.forceUpdate();
                        }}><strong>&times;</strong> Close</button> 
                    </div>
                break;
            case 'edit':
                // post content with be replaced with an 'edit' PostForm
                post.content = <PostForm type = 'edit' value ={content} 
                info = {Object.assign({}, info, {post_id : id})} 
                // function to cancel edit 
                cancelEdit = {(e) => {
                    if (!e) e = window.event;
                    e.preventDefault();
                    e.stopPropagation();
                    post.content = content;
                    if(page != id) {
                        this.clearoe();
                        this.setState({
                            index: index,
                        })
                    }
                    else this.forceUpdate();   
                }}
                // run following function after PostForm submit
                submit = {(value) => {
                    if(!post.original) post.original = content;
                    post.content = value; 
                    if(page != id){
                        this.setState({
                            roe : false,
                            index : index,
                        });
                        this.fetchData(info.current_page);
                    }else this.forceUpdate();
                }} />;
                break;
            case 'like':
                // update post likes on server 
                await update('like', id)
                .catch((error) => { 
                    alert(error);
                    throw new Error(`Like Unsuccessful. ${error.message}`);
                }); 
                // check if authenticated user already likes the post .. remove if it does, add if it doesnt 
                if (post.likes.indexOf(this.sess)>=0){
                    post.likes.splice(post.likes.indexOf(this.sess), 1)
                }
                else post.likes.push(this.sess);
                break;
            case 'reply':
                // add reply form to posts list
                post = {
                    id: id+100, //key
                    type : 'form',
                    info : Object.assign({}, info, {post_id : id}),
                    // function to be called on PostForm submit
                    submit : this.replySubmit,
                    // send ref to play message animation after submit
                    ref : this.ref,
                };
                posts.splice(i+1,0, post);
                break;
        }
        if (type != 'like' && id != page) {
            this.setState({
                phs : phs.concat({posts : posts, info : info}), // update phs
                index : phs.length,
                roe : true,
            });
        }else this.forceUpdate();
    }
    
    replySubmit(){
        const {phs, index} = this.state;
        const {info} = phs[index]
        // get element from created ref
        const node = this.ref.current;
        // animation to pop a message after reply is submitted
        const message = new Animation( new KeyframeEffect(node, 
            [ 
                {
                    opacity: "100%",
                    lineHeight: "100%",
                    height: "auto",
                },
                {
                    opacity: "0%",
                    lineHeight: "50%",
                    height: "50%",
                },
                {
                    opacity: "0%",
                    lineHeight: "0%",
                    height: "0%",
                }
            ], 
            {delay: 1000, duration: 800}),
            document.timeline);
        // transform node (previously reply form) into success message 
        node.className = 'm-3 alert alert-success';
        node.innerHTML ='Post replied successfully';
        message.play();
        message.onfinish = () => {
            // remove last phs after animation
            this.state.phs.pop();
            this.setState({
                roe : false,
                isLoaded : false,
                index : index-1,
            });
            // reload data
            this.fetchData(info.current_page);
        }
    }
    async handlePage(page){
        await this.clearoe();
        const {phs, index} = this.state;
        const {info} = phs[index];
        const {current_page, has_next, has_previous} = info;
        let page_number;
        // isLoaded set to false 
        this.setState({
            isLoaded: false,
        });
        if(page === 'n' && has_next===true) page_number = current_page+1;
        else if (page === 'p' && has_previous===true) page_number = current_page-1;
        else if(page[0] === '@'){
            await this.setState({
                page : page
            })
            return this.fetchData(1);
        }
        else { 
            this.setState({
                error: "Failed to load page.",
            });
            throw new Error(`Invalid page parameter`);
        };
        //history.pushState({page : page_name, number: page_number}, '' , `?page=${page}`);
        // check if page was already fetched - reversed array to get last result (updated in case post was edited)
        const res = phs.slice().reverse().findIndex((elem) => elem.info && elem.info.current_page === page_number);
        if(res>=0){
            // change index of posts to be rendered if it was
            this.setState({
                index: (phs.length-1)-res,
                isLoaded: true,
            }); 
        }
        else {
            // fetch page if it wasnt 
            this.fetchData(page_number);
        }
        
    }
    async handlePost(e, id){
        if(!e) e = window.event;
        e.preventDefault();
        e.stopPropagation();
        this.clearoe();
        await this.setState({
            page:id,
            isLoaded:false,
        });
        const {phs, index} = this.state;
        const posts = phs[index].posts.slice();
        const i = posts.findIndex((elem)=> elem.id === id);
        this.post_page = Object.assign({}, posts[i]);
        this.fetchData(1);
    }   
    render() {
        console.log('begin render');
        const {error, isLoaded, phs, index} = this.state;
        if(error){
            return <div className = 'm-3 alert alert-danger'><strong>Error!</strong> {error} </div>
        }else if (!isLoaded){
            return <div>Loading...</div>
        }else{
            // render last state
            const posts = phs[index].posts.slice();
            const {info} = phs[index];
            console.log(`index: ${index}`);
            return (
                <div>
                    {this.state.page === 'homepage' && this.sess && 
                        <div className='form-group p-3 my-3 border'> 
                            <h5 className='txr'>Hi @{this.sess} ! Share your thoughts.</h5>
                            <PostForm user = {this.sess} info = {info} 
                            submit = {() => this.fetchData(info.current_page)} /> 
                        </div>}
                    {!this.sess && this.state.page === 'homepage' &&
                        <div className = " p-3 my-3 m-4 text-right">
                            <h3 className= "pr-5"><a href="/login">Log in</a> to share your thoughts.</h3>
                        </div>
                     }
                    {this.state.page[0] === '@' && <Profile profile = {this.state.profile} /> }
                    {typeof this.state.page === 'number' && 
                        <OpenPost post = {this.post_page } 
                            info = {info}
                            handleOperation = {this.handleOp}
                            //handlePost ={this.handlePost}
                            //handlePage={this.handlePage}
                            submitReply = {async () => {
                                await this.setState({
                                    isLoaded:false,
                                });
                                this.fetchData(info.current_page);
                            }}
                        />}
                    
                    <LoadPosts 
                        posts = {posts}
                        info = {info}
                        handleOperation = {this.handleOp}
                        handlePost ={this.handlePost}
                        handlePage={this.handlePage}
                    />
                    
                </div>
            );
        }  
    }
}
function MountNetwork(){
    ReactDOM.unmountComponentAtNode(document.querySelector('#load'));
    ReactDOM.render(
        <Network />, 
        document.querySelector('#load')
    );
}
MountNetwork();
