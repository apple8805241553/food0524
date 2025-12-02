
function Children1({ count, setCount }) {
    return (
        <div>
            <div>{count}</div>
            <button onClick={setCount}>子組件A的+1</button>
        </div>
    )
}

export default Children1