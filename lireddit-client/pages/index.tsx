import { withUrqlClient } from "next-urql";
import NavBar from "../components/NavBar";
import { usePostsQuery } from "../generated/graphql";
import { createUrqlClient } from "../utils/createUrqlClient";

function Home() {
    const [{ data }] = usePostsQuery();
    return (
        <>
            <NavBar />
            <section>
                <h1>Hello</h1>
                {!data ? (
                    <div>Loading</div>
                ) : (
                    data.posts.map((p) => <div key={p.id}>{p.title}</div>)
                )}
            </section>
        </>
    );
}

export default withUrqlClient(createUrqlClient, { ssr: true })(Home);
