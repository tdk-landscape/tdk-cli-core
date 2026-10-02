require "sinatra"
require "json"

set :bind, "0.0.0.0"
set :port, Integer(ENV.fetch("PORT", "4567"))

get "/health" do
  content_type :json
  { status: "ok", service: "sinatra" }.to_json
end

get "/" do
  content_type :json
  { service: "sinatra", endpoints: ["/health"] }.to_json
end
