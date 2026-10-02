# A minimal Sinatra 4 app (Sinatra has no project generator, so the app is the files next to this Dockerfile).
FROM ruby:3.4-slim
RUN apt-get update -qq && apt-get install -y -qq build-essential >/dev/null && rm -rf /var/lib/apt/lists/*
WORKDIR /app
COPY Gemfile ./
RUN bundle install --quiet
COPY app.rb ./
# Classic-style apps start their own server when run directly (Puma here); app.rb binds 0.0.0.0 and reads PORT.
CMD ["ruby", "app.rb"]
