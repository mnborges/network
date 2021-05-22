document.querySelector('#body-header').addEventListener('DOMContentLoaded', DOMLoaded());

function DOMLoaded(){
    console.log('loaded body-header');
    document.querySelector('#all').addEventListener('click', () => {
        LoadPage('all');
    });
    if (document.querySelector('#network').dataset.user != 'False') {
        document.querySelector('#follow').addEventListener('click', () => {
            LoadPage('following');
        });
        document.querySelector('#profile').addEventListener('click', () => {
            LoadPage('profile');
        });
    } 
    LoadPage('all');
}

function LoadPage(page) {
    //document.querySelector('#body-header').innerHTML = `<h3>${page}</h3>`;
    if (page === 'all'){ 
        console.log('all posts');
        if (document.querySelector('#network').dataset.user != 'False') document.querySelector('#new-post').style.display = 'block';
        fetchPosts('all');
    }else{
        document.querySelector('#new-post').style.display = 'none';
        fetchPosts(`${page}`)
    }
}
function fetchPosts(filter) {
    console.log(`fetch page: ${filter}`);
    fetch(`/posts/${filter}`)
    .then(response => response.json())
    .then(posts => {
        console.log(posts)
            // Result 
            if (posts.error != undefined) {
                console.log(`${posts.error}`);
                alert(`${posts.error}`);
            } else {
                let load = new LoadPosts(posts = {posts});
                ReactDOM.render(load.render(posts), document.querySelector('#load'));
            }
    });
    return false; 
}
function newPost(content) {
    fetch('/posts', {
        method: 'POST',
        body: JSON.stringify({
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
/* 
    ADD FEATURE TO FORM: display available characters (countdown) + disable submit if over limit 
*/ 
class PostForm extends React.Component {
    constructor(props) {
        super(props);
        this.state = { value: '' };
        this.handleChange = this.handleChange.bind(this);
        this.handleSubmit = this.handleSubmit.bind(this);
    }

    handleChange(event) {
        this.setState({ value: event.target.value });
    }

    handleSubmit(event) {
        newPost(this.state.value);
        this.setState({value :'', });
        document.querySelector('#newp').style.cursor = 'wait';
		document.querySelector('#newp').disabled=true;
		setTimeout(() => { LoadPage('all')}, 300); //improve???
        document.querySelector('#newp').disabled=false;
        document.querySelector('#newp').style.cursor = 'pointer';
        event.preventDefault();
    }

    render() {
        const text = `Hi @${this.props.user} ! Share your thoughts. `
        return (
            <form onSubmit={this.handleSubmit}>
                <fieldset id="PostForm">
                    <h5 className='txr'>{text}</h5>
                    <textarea className="form-control" value={this.state.value} onChange={this.handleChange} />
                    <input className="btn post txr mt-2" type="submit" id="newp" value="Post" />
                </fieldset>
            </form>
        );
    }
}
class Each extends React.Component {
    //console.log('Inside eachPost');
    constructor(props){
        super(props);
        this.getUser = this.getUser.bind(this);
    }
    getUser(author){
        /*Redirect to user profile*/
        LoadPage(`@${author}`);
    }
    render(){
        const text = 'AVATAR HERE';
        return (
            <div className="row post">
                <div className="col-2">{text}</div>
                <div className="col-10">
                    <a className="txr" href = '#' onClick= {() => this.getUser(this.props.post.author)}>
                        <strong >@{this.props.post.author} </strong>
                    </a> 
                    | <i className = 'txo'>{this.props.post.timestamp}</i> 
                    <p>{this.props.post.content}</p>
                </div>
            </div>
        );
    }
} 
class LoadPosts extends React.Component{
    constructor(props){
        super(props);/*
        this.state = {
            //content:props.post.content,
            //all : this.props,
        };*/
        this.all = this.props.posts;
        this.handleClick = this.handleClick.bind(this); 
    }
    handleClick(){
        //edit content of post function
        //REDIRECT TO FUNCTION to update content on server
        //this.setState({content : this.props.posts.content});
        return console.log('still developing');
    }
    render() {
        //console.log('inside LoadPost');
        const text = 'Edit';
        return (
            <div className='p-5'>
                {this.all.map((post) => <Each post={post} key={post.id}/> )}
                <button onClick = {this.handleClick}>{text}</button>
            </div>
        );
        /* Add reply button and function*/
    }
}
/*
class LoadProfile extends React.Component{
    constructor(props){
        super(props);
        this.username = this.props.post.author
    }
} */